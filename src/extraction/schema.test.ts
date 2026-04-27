import { describe, it, expect } from "vitest";
import { ExtractionResultSchema } from "./schema.js";

const validResult = {
  action_items: [
    { task: "Send follow-up email", owner: "Alice", due: "2026-05-01", priority: "high" as const },
    { task: "Review PR #42", owner: null, due: null, priority: "medium" as const },
  ],
  decisions: [
    { decision: "Ship v1 next Friday", made_by: "Bob" },
    { decision: "Drop the Confluence export", made_by: null },
  ],
  open_questions: ["Who owns the migration?", "Do we need a feature flag?"],
  summary: "The team aligned on shipping v1 and deferred two design decisions.",
  attendees: [
    { name: "Alice", topics: ["roadmap", "hiring"], word_count: 412 },
    { name: "Bob", topics: ["release"], word_count: 287 },
  ],
};

describe("ExtractionResultSchema — AC2 happy path", () => {
  it("accepts a fully-populated valid object", () => {
    const parsed = ExtractionResultSchema.parse(validResult);
    expect(parsed).toEqual(validResult);
  });

  it("accepts empty arrays for every collection field", () => {
    const empty = {
      action_items: [],
      decisions: [],
      open_questions: [],
      summary: "Brief sync, nothing to report.",
      attendees: [],
    };
    expect(() => ExtractionResultSchema.parse(empty)).not.toThrow();
  });
});

describe("ExtractionResultSchema — AC2 rejects malformed shapes", () => {
  it("rejects when a required top-level field is missing", () => {
    const { summary, ...missingSummary } = validResult;
    void summary;
    expect(() => ExtractionResultSchema.parse(missingSummary)).toThrow();
  });

  it("rejects an action_item with an unknown priority value", () => {
    const bad = {
      ...validResult,
      action_items: [{ task: "x", owner: null, due: null, priority: "urgent" }],
    };
    expect(() => ExtractionResultSchema.parse(bad)).toThrow();
  });

  it("rejects a non-string summary", () => {
    const bad = { ...validResult, summary: 42 };
    expect(() => ExtractionResultSchema.parse(bad)).toThrow();
  });

  it("rejects an attendee with non-numeric word_count", () => {
    const bad = {
      ...validResult,
      attendees: [{ name: "Alice", topics: [], word_count: "lots" }],
    };
    expect(() => ExtractionResultSchema.parse(bad)).toThrow();
  });
});
