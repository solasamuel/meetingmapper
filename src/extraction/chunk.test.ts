import { describe, it, expect } from "vitest";
import type { Transcript } from "../parsers/types.js";
import { chunkTranscript, countWords, WORDS_PER_CHUNK } from "./chunk.js";

const makeEntry = (speaker: string, text: string, timestamp: string | null = null) => ({
  speaker,
  text,
  timestamp,
});

const repeat = (word: string, n: number) => Array(n).fill(word).join(" ");

describe("countWords", () => {
  it("returns total word count across all entries", () => {
    const t: Transcript = [
      makeEntry("A", "one two three"),
      makeEntry("B", "four five"),
    ];
    expect(countWords(t)).toBe(5);
  });

  it("handles empty transcript", () => {
    expect(countWords([])).toBe(0);
  });
});

describe("chunkTranscript — AC1 ~1500-word windows", () => {
  it("returns a single chunk when transcript is below the per-chunk word budget", () => {
    const t: Transcript = [makeEntry("A", repeat("hello", 100))];
    const chunks = chunkTranscript(t);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual(t);
  });

  it("splits into multiple chunks when transcript exceeds the per-chunk budget", () => {
    const t: Transcript = [
      makeEntry("A", repeat("word", WORDS_PER_CHUNK)),
      makeEntry("B", repeat("word", WORDS_PER_CHUNK)),
      makeEntry("C", repeat("word", WORDS_PER_CHUNK)),
    ];
    const chunks = chunkTranscript(t);
    expect(chunks.length).toBeGreaterThanOrEqual(3);
  });

  it("preserves entry boundaries — never splits inside a single entry's text", () => {
    const t: Transcript = [
      makeEntry("A", repeat("word", 800)),
      makeEntry("B", repeat("word", 800)),
      makeEntry("C", repeat("word", 800)),
    ];
    const chunks = chunkTranscript(t);
    const allEntries = chunks.flat();
    expect(allEntries).toEqual(t);
  });

  it("every chunk is non-empty", () => {
    const t: Transcript = Array.from({ length: 10 }, (_, i) =>
      makeEntry(`S${i}`, repeat("word", 500)),
    );
    const chunks = chunkTranscript(t);
    for (const chunk of chunks) {
      expect(chunk.length).toBeGreaterThan(0);
    }
  });
});
