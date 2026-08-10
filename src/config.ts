import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import type { ChangeProofConfig } from "./types.js";

const glob = z
  .string()
  .trim()
  .min(1, "Glob patterns cannot be empty")
  .refine((value) => !value.startsWith("!"), {
    message: "Negated globs are not supported; use when.ignore instead",
  });

const globList = z.array(glob).min(1);

const policySchema = z
  .object({
    id: z.string().trim().regex(/^[a-z0-9][a-z0-9-]*$/, {
      message: "Policy ids must use lowercase letters, digits, and hyphens",
    }),
    description: z.string().trim().min(1).optional(),
    when: z
      .object({
        changed: globList,
        ignore: globList.optional(),
      })
      .strict(),
    require: z
      .object({
        any: globList.optional(),
        all: globList.optional(),
      })
      .strict()
      .refine((value) => value.any !== undefined || value.all !== undefined, {
        message: "At least one of require.any or require.all is required",
      }),
    severity: z.enum(["error", "warning"]).default("error"),
    message: z.string().trim().min(1).optional(),
  })
  .strict();

const configSchema = z
  .object({
    $schema: z.string().optional(),
    version: z.literal(1),
    policies: z.array(policySchema).min(1),
  })
  .strict()
  .superRefine((value, context) => {
    const seen = new Set<string>();
    for (const [index, policy] of value.policies.entries()) {
      if (seen.has(policy.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["policies", index, "id"],
          message: `Duplicate policy id: ${policy.id}`,
        });
      }
      seen.add(policy.id);
    }
  });

export class ConfigError extends Error {
  override readonly name = "ConfigError";
}

export function parseConfig(source: string): ChangeProofConfig {
  let document: unknown;
  try {
    document = parseYaml(source);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new ConfigError(`Invalid YAML: ${detail}`);
  }

  const result = configSchema.safeParse(document);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "config"}: ${issue.message}`)
      .join("\n");
    throw new ConfigError(`Invalid ChangeProof configuration:\n${details}`);
  }

  return result.data;
}

export async function loadConfig(
  configPath = ".changeproof.yml",
  cwd = process.cwd(),
): Promise<ChangeProofConfig> {
  const absolutePath = path.resolve(cwd, configPath);
  let source: string;
  try {
    source = await readFile(absolutePath, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new ConfigError(`Configuration file not found: ${absolutePath}`);
    }
    throw error;
  }
  return parseConfig(source);
}
