#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Command, CommanderError } from "commander";
import { loadConfig } from "./config.js";
import { evaluate } from "./evaluate.js";
import {
  formatGitHub,
  formatJson,
  formatMarkdown,
  formatPretty,
  formatSarif,
} from "./format.js";
import { getChanges } from "./git.js";

type OutputFormat = "pretty" | "json" | "markdown" | "github" | "sarif";

const starterConfig = `# ChangeProof: declarative evidence gates for pull requests
version: 1

policies:
  - id: source-needs-tests
    description: Source changes should include test evidence.
    when:
      changed:
        - "src/**"
      ignore:
        - "src/**/*.test.*"
    require:
      any:
        - "test/**"
        - "tests/**"
        - "**/*.test.*"
        - "**/*.spec.*"
    severity: error
    message: Add or update a test that exercises this source change.
`;

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function render(format: OutputFormat, result: ReturnType<typeof evaluate>): string {
  switch (format) {
    case "json":
      return formatJson(result);
    case "markdown":
      return formatMarkdown(result);
    case "github":
      return formatGitHub(result);
    case "sarif":
      return formatSarif(result);
    case "pretty":
      return formatPretty(result);
  }
}

export async function run(argv = process.argv): Promise<number> {
  const program = new Command()
    .name("changeproof")
    .description("Require evidence files when sensitive paths change.")
    .version("0.1.3")
    .exitOverride();

  program
    .command("check", { isDefault: true })
    .description("Evaluate changed files against repository policies.")
    .option("-c, --config <path>", "configuration path", ".changeproof.yml")
    .option("--base <revision>", "base Git revision")
    .option("--head <revision>", "head Git revision", "HEAD")
    .option(
      "--file <path>",
      "explicit changed file; repeat to provide more than one",
      collect,
      [],
    )
    .option(
      "-f, --format <format>",
      "pretty, json, markdown, github, or sarif",
      "pretty",
    )
    .option("-o, --output <path>", "write output to a file instead of stdout")
    .action(async (options: {
      config: string;
      base?: string;
      head: string;
      file: string[];
      format: string;
      output?: string;
    }) => {
      const formats: OutputFormat[] = [
        "pretty",
        "json",
        "markdown",
        "github",
        "sarif",
      ];
      if (!formats.includes(options.format as OutputFormat)) {
        throw new Error(`Unsupported format: ${options.format}`);
      }
      const config = await loadConfig(options.config);
      const changedFiles =
        options.file.length > 0
          ? options.file
          : getChanges({
              ...(options.base === undefined ? {} : { base: options.base }),
              head: options.head,
            });
      const result = evaluate(config, changedFiles);
      const output = render(options.format as OutputFormat, result);
      if (options.output === undefined) {
        process.stdout.write(output.endsWith("\n") ? output : `${output}\n`);
      } else {
        await writeFile(path.resolve(options.output), output, "utf8");
      }
      process.exitCode = result.success ? 0 : 1;
    });

  program
    .command("init")
    .description("Create a starter .changeproof.yml file.")
    .option("--force", "replace an existing file", false)
    .action(async (options: { force: boolean }) => {
      const flag = options.force ? "w" : "wx";
      try {
        await writeFile(path.resolve(".changeproof.yml"), starterConfig, {
          encoding: "utf8",
          flag,
        });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "EEXIST") {
          throw new Error(
            ".changeproof.yml already exists. Use --force to replace it.",
          );
        }
        throw error;
      }
      process.stdout.write("Created .changeproof.yml\n");
    });

  try {
    await program.parseAsync(argv);
    return typeof process.exitCode === "number" ? process.exitCode : 0;
  } catch (error) {
    if (error instanceof CommanderError) {
      if (error.code === "commander.helpDisplayed") return 0;
      if (error.code === "commander.version") return 0;
      return error.exitCode;
    }
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`ChangeProof: ${message}\n`);
    return 2;
  }
}

if (
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  const code = await run();
  process.exitCode = code;
}
