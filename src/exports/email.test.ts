import { describe, it, expect } from "vitest";
import { formatEmail } from "./email.js";
import { sampleResult, minimalResult } from "./__fixtures__/sample-result.js";

describe("formatEmail — AC1 plain text with clear section headers", () => {
  it("returns an object with subject and body", () => {
    const result = formatEmail(sampleResult);
    expect(result).toHaveProperty("subject");
    expect(result).toHaveProperty("body");
    expect(typeof result.subject).toBe("string");
    expect(typeof result.body).toBe("string");
  });

  it("body contains a section header for each populated section", () => {
    const { body } = formatEmail(sampleResult);
    expect(body).toMatch(/Action Items/i);
    expect(body).toMatch(/Decisions/i);
    expect(body).toMatch(/Open Questions/i);
    expect(body).toMatch(/Summary/i);
    expect(body).toMatch(/Attendees/i);
  });

  it("body renders every action item with task, owner, due, and priority visible", () => {
    const { body } = formatEmail(sampleResult);
    expect(body).toContain("Send follow-up email to design team");
    expect(body).toContain("Alice");
    expect(body).toContain("2026-05-01");
    expect(body).toMatch(/high/i);
  });

  it("body renders every decision and open question", () => {
    const { body } = formatEmail(sampleResult);
    expect(body).toContain("Ship v1 next Friday");
    expect(body).toContain("Drop the Confluence export from v1");
    expect(body).toContain("Who owns the migration?");
    expect(body).toContain("Do we need a feature flag for the rollout?");
  });

  it("body renders attendee names and word counts", () => {
    const { body } = formatEmail(sampleResult);
    expect(body).toContain("Alice");
    expect(body).toContain("Bob");
    expect(body).toContain("412");
    expect(body).toContain("287");
  });
});

describe("formatEmail — AC2 subject line derived from summary", () => {
  it("uses the first sentence of the summary as the subject (truncated to length cap)", () => {
    const { subject } = formatEmail(sampleResult);
    // Sample summary's first sentence is 95 chars; truncated to 80 with ellipsis.
    expect(subject.startsWith("The team aligned on shipping v1 next Friday")).toBe(true);
    expect(subject.length).toBeLessThanOrEqual(80);
  });

  it("subject is non-empty for the minimal fixture", () => {
    const { subject } = formatEmail(minimalResult);
    expect(subject).toBe("Brief check-in, nothing to report.");
  });

  it("T-EXP-08: subject is at most 80 characters", () => {
    const longSummary = {
      ...sampleResult,
      summary:
        "This is an extremely long opening sentence that absolutely positively must be truncated because it goes well past any reasonable subject line length anyone would ever want.",
    };
    const { subject } = formatEmail(longSummary);
    expect(subject.length).toBeLessThanOrEqual(80);
  });

  it("appends an ellipsis when truncated", () => {
    const longSummary = {
      ...sampleResult,
      summary:
        "This is an extremely long opening sentence that absolutely positively must be truncated because it goes well past any reasonable subject line length anyone would ever want.",
    };
    const { subject } = formatEmail(longSummary);
    expect(subject).toMatch(/…$/);
  });
});

describe("formatEmail — AC3 no markdown artefacts", () => {
  it("body contains no markdown task-checkbox syntax '- [ ]'", () => {
    const { body } = formatEmail(sampleResult);
    expect(body).not.toMatch(/- \[ \]/);
    expect(body).not.toMatch(/- \[x\]/i);
  });

  it("body contains no markdown header syntax (lines starting with #)", () => {
    const { body } = formatEmail(sampleResult);
    const lines = body.split("\n");
    for (const line of lines) {
      expect(line).not.toMatch(/^#+\s/);
    }
  });

  it("body contains no markdown bold/emphasis syntax (** or __)", () => {
    const { body } = formatEmail(sampleResult);
    expect(body).not.toMatch(/\*\*/);
    expect(body).not.toMatch(/__/);
  });

  it("body contains no inline asterisks at all", () => {
    const { body } = formatEmail(sampleResult);
    expect(body).not.toContain("*");
  });

  it("subject contains no markdown artefacts either", () => {
    const { subject } = formatEmail(sampleResult);
    expect(subject).not.toMatch(/[*#_]|- \[/);
  });
});

describe("formatEmail — edge cases", () => {
  it("renders all five sections even when every collection is empty", () => {
    const { body } = formatEmail(minimalResult);
    expect(body).toMatch(/ACTION ITEMS/);
    expect(body).toMatch(/DECISIONS/);
    expect(body).toMatch(/OPEN QUESTIONS/);
    expect(body).toMatch(/SUMMARY/);
    expect(body).toMatch(/ATTENDEES/);
  });

  it("shows '(none)' under each empty section instead of leaving it blank", () => {
    const { body } = formatEmail(minimalResult);
    const sections = body.split(/\n\n/);
    const emptySections = sections.filter((s) => /\(none\)/.test(s));
    // 4 of the 5 sections are empty in minimalResult (everything except SUMMARY)
    expect(emptySections).toHaveLength(4);
  });

  it("renders the summary text even when other sections are empty", () => {
    const { body } = formatEmail(minimalResult);
    expect(body).toContain(minimalResult.summary);
  });
});
