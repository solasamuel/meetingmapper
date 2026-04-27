import { describe, it, expect } from "vitest";
import { formatSlack, SLACK_MESSAGE_LIMIT } from "./slack.js";
import { sampleResult, minimalResult } from "./__fixtures__/sample-result.js";

describe("formatSlack — AC1 '*bold*' headers", () => {
  it("renders each section header inside single asterisks (Slack bold)", () => {
    const msg = formatSlack(sampleResult);
    expect(msg).toMatch(/\*Action Items\*/);
    expect(msg).toMatch(/\*Decisions\*/);
    expect(msg).toMatch(/\*Open Questions\*/);
    expect(msg).toMatch(/\*Summary\*/);
    expect(msg).toMatch(/\*Attendees\*/);
  });

  it("does not use markdown's '**' double-asterisk bold (cross-format guard)", () => {
    const msg = formatSlack(sampleResult);
    expect(msg).not.toMatch(/\*\*[^*]/);
  });
});

describe("formatSlack — AC2 '•' bullets", () => {
  it("renders bullets with the '•' character (Slack convention)", () => {
    const msg = formatSlack(sampleResult);
    expect(msg).toContain("• Send follow-up email to design team");
    expect(msg).toContain("• Ship v1 next Friday");
    expect(msg).toContain("• Who owns the migration?");
  });

  it("does not use '- ' or '* ' markdown/Confluence bullets (cross-format guard)", () => {
    const msg = formatSlack(sampleResult);
    const lines = msg.split("\n");
    for (const line of lines) {
      expect(line).not.toMatch(/^- /);
      expect(line).not.toMatch(/^\* [^A-Z]/);
    }
  });
});

describe("formatSlack — AC3 message length limit", () => {
  it("output is under SLACK_MESSAGE_LIMIT for the sample fixture", () => {
    const msg = formatSlack(sampleResult);
    expect(msg.length).toBeLessThan(SLACK_MESSAGE_LIMIT);
  });

  it("appends a truncation notice when output would exceed the limit", () => {
    // Inflate summary past the limit
    const giant = {
      ...sampleResult,
      summary: "x".repeat(SLACK_MESSAGE_LIMIT + 1000),
    };
    const msg = formatSlack(giant);
    expect(msg.length).toBeLessThanOrEqual(SLACK_MESSAGE_LIMIT);
    expect(msg).toMatch(/truncated/i);
  });

  it("no truncation notice on normal-sized inputs", () => {
    const msg = formatSlack(sampleResult);
    expect(msg).not.toMatch(/truncated/i);
  });
});

describe("formatSlack — edge cases", () => {
  it("renders all section headers when collections are empty", () => {
    const msg = formatSlack(minimalResult);
    expect(msg).toMatch(/\*Action Items\*/);
    expect(msg).toMatch(/\*Decisions\*/);
    expect(msg).toMatch(/\*Open Questions\*/);
    expect(msg).toMatch(/\*Summary\*/);
    expect(msg).toMatch(/\*Attendees\*/);
  });

  it("includes summary text in the minimal fixture", () => {
    const msg = formatSlack(minimalResult);
    expect(msg).toContain(minimalResult.summary);
  });
});
