import { describe, it, expect } from "vitest";
import type { Transcript } from "../parsers/types.js";
import { mergeAdjacentSameSpeaker } from "./diarisation.js";

describe("mergeAdjacentSameSpeaker — AC1 same-speaker merge", () => {
  it("merges two consecutive entries from the same speaker into one", () => {
    const input: Transcript = [
      { speaker: "Alice", text: "Good morning.", timestamp: "00:00:01" },
      { speaker: "Alice", text: "Hope everyone slept well.", timestamp: "00:00:04" },
    ];
    const result = mergeAdjacentSameSpeaker(input);
    expect(result).toHaveLength(1);
    expect(result[0]?.text).toBe("Good morning. Hope everyone slept well.");
    expect(result[0]?.speaker).toBe("Alice");
  });

  it("merges three+ consecutive entries from the same speaker", () => {
    const input: Transcript = [
      { speaker: "Alice", text: "One.", timestamp: "00:00:01" },
      { speaker: "Alice", text: "Two.", timestamp: "00:00:04" },
      { speaker: "Alice", text: "Three.", timestamp: "00:00:07" },
    ];
    const result = mergeAdjacentSameSpeaker(input);
    expect(result).toHaveLength(1);
    expect(result[0]?.text).toBe("One. Two. Three.");
  });
});

describe("mergeAdjacentSameSpeaker — AC2 timestamp retention", () => {
  it("merged entry keeps the earliest timestamp", () => {
    const input: Transcript = [
      { speaker: "Alice", text: "First.", timestamp: "00:00:01" },
      { speaker: "Alice", text: "Second.", timestamp: "00:00:04" },
      { speaker: "Alice", text: "Third.", timestamp: "00:00:07" },
    ];
    const result = mergeAdjacentSameSpeaker(input);
    expect(result[0]?.timestamp).toBe("00:00:01");
  });

  it("works when the first entry has a null timestamp and later ones don't", () => {
    const input: Transcript = [
      { speaker: "Alice", text: "First.", timestamp: null },
      { speaker: "Alice", text: "Second.", timestamp: "00:00:04" },
    ];
    const result = mergeAdjacentSameSpeaker(input);
    expect(result[0]?.timestamp).toBeNull();
  });
});

describe("mergeAdjacentSameSpeaker — AC3 unlabelled entries left untouched", () => {
  it("does NOT merge two consecutive entries when both speakers are null", () => {
    const input: Transcript = [
      { speaker: null, text: "First unlabelled block.", timestamp: null },
      { speaker: null, text: "Second unlabelled block.", timestamp: null },
    ];
    const result = mergeAdjacentSameSpeaker(input);
    expect(result).toHaveLength(2);
    expect(result[0]?.text).toBe("First unlabelled block.");
    expect(result[1]?.text).toBe("Second unlabelled block.");
  });

  it("merges labelled-then-labelled around a null block without absorbing the null", () => {
    const input: Transcript = [
      { speaker: "Alice", text: "Start.", timestamp: "00:00:01" },
      { speaker: null, text: "Background noise.", timestamp: "00:00:04" },
      { speaker: "Alice", text: "End.", timestamp: "00:00:07" },
    ];
    const result = mergeAdjacentSameSpeaker(input);
    expect(result).toHaveLength(3);
    expect(result[0]?.speaker).toBe("Alice");
    expect(result[1]?.speaker).toBeNull();
    expect(result[2]?.speaker).toBe("Alice");
  });
});

describe("mergeAdjacentSameSpeaker — edge cases", () => {
  it("returns an empty array for an empty input (does not throw)", () => {
    expect(mergeAdjacentSameSpeaker([])).toEqual([]);
  });

  it("returns a single entry unchanged", () => {
    const input: Transcript = [
      { speaker: "Alice", text: "Lone entry.", timestamp: "00:00:01" },
    ];
    const result = mergeAdjacentSameSpeaker(input);
    expect(result).toEqual(input);
  });

  it("preserves alternating speakers entry-for-entry", () => {
    const input: Transcript = [
      { speaker: "Alice", text: "A1.", timestamp: "00:00:01" },
      { speaker: "Bob", text: "B1.", timestamp: "00:00:04" },
      { speaker: "Alice", text: "A2.", timestamp: "00:00:07" },
      { speaker: "Bob", text: "B2.", timestamp: "00:00:10" },
    ];
    const result = mergeAdjacentSameSpeaker(input);
    expect(result).toHaveLength(4);
    expect(result.map((e) => e.speaker)).toEqual(["Alice", "Bob", "Alice", "Bob"]);
  });

  it("does not mutate the input array", () => {
    const input: Transcript = [
      { speaker: "Alice", text: "One.", timestamp: "00:00:01" },
      { speaker: "Alice", text: "Two.", timestamp: "00:00:04" },
    ];
    const snapshot = structuredClone(input);
    mergeAdjacentSameSpeaker(input);
    expect(input).toEqual(snapshot);
  });
});
