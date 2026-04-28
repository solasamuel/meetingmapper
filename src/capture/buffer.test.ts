import { describe, it, expect } from "vitest";
import { InMemoryCaptionBuffer } from "./buffer.js";

describe("InMemoryCaptionBuffer", () => {
  it("starts empty", () => {
    const buf = new InMemoryCaptionBuffer();
    expect(buf.getAll()).toEqual([]);
  });

  it("appends entries in order", () => {
    const buf = new InMemoryCaptionBuffer();
    buf.append({ speaker: "Alice", text: "Hello", timestamp: "00:00:01" });
    buf.append({ speaker: "Bob", text: "Hi", timestamp: "00:00:03" });
    expect(buf.getAll()).toEqual([
      { speaker: "Alice", text: "Hello", timestamp: "00:00:01" },
      { speaker: "Bob", text: "Hi", timestamp: "00:00:03" },
    ]);
  });

  it("clear() empties the buffer", () => {
    const buf = new InMemoryCaptionBuffer();
    buf.append({ speaker: null, text: "x", timestamp: null });
    buf.clear();
    expect(buf.getAll()).toEqual([]);
  });

  it("getAll() returns a copy — caller mutations do not leak back into the buffer", () => {
    const buf = new InMemoryCaptionBuffer();
    buf.append({ speaker: null, text: "x", timestamp: null });
    const copy = buf.getAll();
    copy.push({ speaker: "Bad", text: "Mutation", timestamp: null });
    expect(buf.getAll()).toHaveLength(1);
  });
});
