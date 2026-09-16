import { readFile } from "node:fs/promises";
import * as core from "@actions/core";
import { loadConfig, parseConfig } from "./config.js";
import { evaluate } from "./evaluate.js";
import { formatMarkdown } from "./format.js";
import { getChanges, readFileAtRevision } from "./git.js";

interface EventRange {
  base?: string;
  head?: string;
  configRef?: string;
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
  if (event.pull_request !== undefined || event.merge_group !== undefined) {
    const base = event.pull_request?.base?.sha ?? event.merge_group?.base_sha;
    const head = event.pull_request?.head?.sha ?? event.merge_group?.head_sha;
    if (typeof base !== "string" || !base || typeof head !== "string" || !head) {
      throw new Error("Pull request or merge group event is missing base or head commit.");
    }
    return { base, head, configRef: base };
  }
  return { base: event.before, head: event.after };
}

export async function runAction(): Promise<void> {
  try {
    const detected = await eventRange();
    const inputBase = core.getInput("base");
    const inputHead = core.getInput("head");
    const base = inputBase || detected.base;
    const head = inputHead || detected.head || "HEAD";
    const configPath = core.getInput("config") || ".changeproof.yml";
    const config = detected.configRef === undefined
      ? await loadConfig(configPath)
      : parseConfig(readFileAtRevision(detected.configRef, configPath));
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
