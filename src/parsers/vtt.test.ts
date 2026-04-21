import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseVtt } from "./vtt.js";
import { ParseError } from "./types.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__");
const loadFixture = (name: string) => readFileSync(join(fixturesDir, name), "utf8");

describe("parseVtt — AC1 WEBVTT header", () => {
  it("skips the WEBVTT header line and does not emit it as a cue", () => {
    const result = parseVtt(loadFixture("simple.vtt"));
    expect(result).toHaveLength(2);
    expect(result.every((entry) => entry.text !== "WEBVTT")).toBe(true);
  });
});

describe("parseVtt — AC2 timestamp extraction", () => {
  it("extracts the start timestamp of each cue in HH:MM:SS format", () => {
    const result = parseVtt(loadFixture("simple.vtt"));
    expect(result[0]?.timestamp).toBe("00:00:01");
    expect(result[1]?.timestamp).toBe("00:00:05");
  });
});

describe("parseVtt — AC3 speaker inference", () => {
  it("extracts speaker from 'Name: text' prefix and strips it from text", () => {
    const result = parseVtt(loadFixture("with-speakers.vtt"));
    expect(result[0]).toMatchObject({ speaker: "Alice", text: "Good morning team." });
    expect(result[1]).toMatchObject({ speaker: "Bob", text: "Morning. Ready to kick off?" });
  });

  it("returns speaker null when no prefix pattern is present", () => {
    const result = parseVtt(loadFixture("with-speakers.vtt"));
    expect(result[2]).toMatchObject({ speaker: null, text: "No speaker label here." });
  });
});

describe("parseVtt — AC4 output shape", () => {
  it("every entry has exactly the keys speaker, text, timestamp", () => {
    const result = parseVtt(loadFixture("with-speakers.vtt"));
    expect(result.length).toBeGreaterThan(0);
    for (const entry of result) {
      expect(Object.keys(entry).sort()).toEqual(["speaker", "text", "timestamp"]);
      expect(typeof entry.text).toBe("string");
      expect(entry.speaker === null || typeof entry.speaker === "string").toBe(true);
      expect(entry.timestamp === null || typeof entry.timestamp === "string").toBe(true);
    }
  });
});

describe("parseVtt — edge cases", () => {
  it("T-PARSE-03: multi-line cue text is joined with a single space", () => {
    const result = parseVtt(loadFixture("multiline.vtt"));
    expect(result).toHaveLength(1);
    expect(result[0]?.text).toBe("This is the first line and this is the second line of the same cue.");
    expect(result[0]?.speaker).toBe("Alice");
  });

  it("T-PARSE-09: empty input throws ParseError", () => {
    expect(() => parseVtt("")).toThrow(ParseError);
    expect(() => parseVtt("   \n\n  ")).toThrow(ParseError);
  });

  it("T-PARSE-09: ParseError message mentions empty transcript", () => {
    expect(() => parseVtt("")).toThrow(/empty/i);
  });

  it("T-PARSE-10: missing WEBVTT header throws ParseError with line number", () => {
    const input = "00:00:01.000 --> 00:00:04.000\nHello there.\n";
    try {
      parseVtt(input);
      expect.fail("expected ParseError");
    } catch (err) {
      expect(err).toBeInstanceOf(ParseError);
      expect((err as ParseError).line).toBe(1);
    }
  });
});
