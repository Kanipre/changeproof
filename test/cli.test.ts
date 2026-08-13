import { afterEach, describe, expect, it, vi } from "vitest";
import { run } from "../src/cli.js";

describe("CLI metadata", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports the release version", async () => {
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    expect(await run(["node", "changeproof", "--version"])).toBe(0);
    expect(write).toHaveBeenCalledWith(expect.stringContaining("0.1.2"));
  });
});
