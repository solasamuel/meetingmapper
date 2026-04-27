import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (full.endsWith(".ts") && !full.endsWith(".test.ts")) {
      out.push(full);
    }
  }
  return out;
}

describe("AC4 — no hard-coded Anthropic API key in extraction source", () => {
  it("contains no 'sk-ant-' literal in any non-test file under src/extraction/", () => {
    const files = walk(here);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const contents = readFileSync(file, "utf8");
      expect(contents, `unexpected sk-ant- literal in ${file}`).not.toMatch(/sk-ant-/);
    }
  });
});
