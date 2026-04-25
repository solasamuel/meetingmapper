import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseSrt } from "./srt.js";
import { parseVtt } from "./vtt.js";
import { ParseError } from "./types.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__");
const loadFixture = (name: string) => readFileSync(join(fixturesDir, name), "utf8");

describe("parseSrt — AC1 numbered cue blocks", () => {
  it("parses numbered blocks into one entry per cue", () => {
    const result = parseSrt(loadFixture("simple.srt"));
    expect(result).toHaveLength(2);
    expect(result[0]?.text).toBe("Hello everyone, thanks for joining.");
    expect(result[1]?.text).toBe("Let's get started with the agenda.");
  });

  it("does not emit cue-index numbers as transcript text", () => {
    const result = parseSrt(loadFixture("simple.srt"));
    expect(result.every((e) => e.text !== "1" && e.text !== "2")).toBe(true);
  });
});

describe("parseSrt — AC2 comma-separated millisecond timestamps", () => {
  it("extracts HH:MM:SS from SRT's comma-delimited timestamp line", () => {
    const result = parseSrt(loadFixture("simple.srt"));
    expect(result[0]?.timestamp).toBe("00:00:01");
    expect(result[1]?.timestamp).toBe("00:00:05");
  });
});

describe("parseSrt — AC3 speaker inference (parity with VTT)", () => {
  it("extracts speaker from 'Name: text' prefix and strips it from text", () => {
    const result = parseSrt(loadFixture("with-speakers.srt"));
    expect(result[0]).toMatchObject({ speaker: "Alice", text: "Good morning team." });
    expect(result[1]).toMatchObject({ speaker: "Bob", text: "Morning. Ready to kick off?" });
  });

  it("returns speaker null when no prefix pattern is present", () => {
    const result = parseSrt(loadFixture("with-speakers.srt"));
    expect(result[2]).toMatchObject({ speaker: null, text: "No speaker label here." });
  });
});

describe("parseSrt — AC4 output shape identical to VTT (T-PARSE-06)", () => {
  it("equivalent VTT and SRT inputs produce deep-equal outputs", () => {
    const srtResult = parseSrt(loadFixture("with-speakers.srt"));
    const vttResult = parseVtt(loadFixture("with-speakers.vtt"));
    expect(srtResult).toEqual(vttResult);
  });

  it("every entry has exactly the keys speaker, text, timestamp", () => {
    const result = parseSrt(loadFixture("with-speakers.srt"));
    expect(result.length).toBeGreaterThan(0);
    for (const entry of result) {
      expect(Object.keys(entry).sort((a, b) => a.localeCompare(b))).toEqual(["speaker", "text", "timestamp"]);
      expect(typeof entry.text).toBe("string");
      expect(entry.speaker === null || typeof entry.speaker === "string").toBe(true);
      expect(entry.timestamp === null || typeof entry.timestamp === "string").toBe(true);
    }
  });
});

describe("parseSrt — edge cases", () => {
  it("empty input throws ParseError", () => {
    expect(() => parseSrt("")).toThrow(ParseError);
    expect(() => parseSrt("   \n\n  ")).toThrow(ParseError);
  });
});
