import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseTxt } from "./txt.js";
import { ParseError } from "./types.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__");
const loadFixture = (name: string) => readFileSync(join(fixturesDir, name), "utf8");

describe("parseTxt — AC1 per-line speaker detection", () => {
  it("emits one entry per labelled line with speaker stripped from text", () => {
    const result = parseTxt(loadFixture("with-speakers.txt"));
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ speaker: "Alice", text: "Good morning team." });
    expect(result[1]).toMatchObject({ speaker: "Bob", text: "Morning. Ready to kick off?" });
    expect(result[2]).toMatchObject({ speaker: "Alice", text: "Let's start with the roadmap." });
  });
});

describe("parseTxt — AC2 unlabelled fallback", () => {
  it("collapses to a single unlabelled block when no line has a speaker prefix", () => {
    const result = parseTxt(loadFixture("unlabelled.txt"));
    expect(result).toHaveLength(1);
    expect(result[0]?.speaker).toBeNull();
    expect(result[0]?.text).toBe(
      "This is a transcript without any speaker labels. It spans multiple lines and should be treated as one block. The whole thing is just plain prose.",
    );
  });
});

describe("parseTxt — AC3 output shape matches VTT/SRT", () => {
  it("every entry has exactly the keys speaker, text, timestamp", () => {
    for (const fixture of ["with-speakers.txt", "unlabelled.txt"]) {
      const result = parseTxt(loadFixture(fixture));
      expect(result.length).toBeGreaterThan(0);
      for (const entry of result) {
        expect(Object.keys(entry).sort((a, b) => a.localeCompare(b))).toEqual([
          "speaker",
          "text",
          "timestamp",
        ]);
        expect(typeof entry.text).toBe("string");
        expect(entry.speaker === null || typeof entry.speaker === "string").toBe(true);
      }
    }
  });

  it("plain text has no timestamps — every timestamp is null", () => {
    const labelled = parseTxt(loadFixture("with-speakers.txt"));
    const unlabelled = parseTxt(loadFixture("unlabelled.txt"));
    for (const entry of [...labelled, ...unlabelled]) {
      expect(entry.timestamp).toBeNull();
    }
  });
});

describe("parseTxt — edge cases", () => {
  it("empty input throws ParseError", () => {
    expect(() => parseTxt("")).toThrow(ParseError);
    expect(() => parseTxt("   \n\n  ")).toThrow(ParseError);
  });
});
