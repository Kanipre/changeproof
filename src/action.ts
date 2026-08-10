import { readFile } from "node:fs/promises";
import * as core from "@actions/core";
import { loadConfig } from "./config.js";
import { evaluate } from "./evaluate.js";
import { formatMarkdown } from "./format.js";
import { getChanges } from "./git.js";

interface EventRange {
  base?: string;
  head?: string;
}

async function eventRange(): Promise<EventRange> {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (eventPath === undefined) return {};
  const event = JSON.parse(await readFile(eventPath, "utf8")) as {
    pull_request?: { base?: { sha?: string }; head?: { sha?: string } };
    merge_group?: { base_sha?: string; head_sha?: string };
    before?: string;
    after?: string;
  };
  return {
    base:
      event.pull_request?.base?.sha ?? event.merge_group?.base_sha ?? event.before,
    head:
      event.pull_request?.head?.sha ?? event.merge_group?.head_sha ?? event.after,
  };
}

export async function runAction(): Promise<void> {
  try {
    const detected = await eventRange();
    const inputBase = core.getInput("base");
    const inputHead = core.getInput("head");
    const base = inputBase || detected.base;
    const head = inputHead || detected.head || "HEAD";
    const config = await loadConfig(
      core.getInput("config") || ".changeproof.yml",
    );
    const files = getChanges({
      ...(base === undefined ? {} : { base }),
      head,
    });
    const result = evaluate(config, files);

    core.setOutput("passed", result.success ? "true" : "false");
    core.setOutput("errors", String(result.summary.errors));
    core.setOutput("warnings", String(result.summary.warnings));
    core.setOutput("changed-files", String(result.changedFiles.length));

    for (const policy of result.policies) {
      if (policy.status !== "failed") continue;
      const properties = { title: `ChangeProof: ${policy.id}` };
      if (policy.severity === "error") core.error(policy.message, properties);
      else core.warning(policy.message, properties);
    }

    await core.summary.addRaw(formatMarkdown(result)).write();
    if (!result.success) {
      core.setFailed(
        `Missing required change evidence (${result.summary.errors} errors).`,
      );
    }
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

void runAction();
