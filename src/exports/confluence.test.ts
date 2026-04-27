import { describe, it, expect } from "vitest";
import { formatConfluence } from "./confluence.js";
import { sampleResult, minimalResult } from "./__fixtures__/sample-result.js";

describe("formatConfluence — AC1 wiki-markup headers", () => {
  it("uses 'h1.' for the document title and 'h2.' for sections", () => {
    const wiki = formatConfluence(sampleResult);
    expect(wiki).toMatch(/^h1\.\s+Meeting Notes/m);
    expect(wiki).toMatch(/^h2\.\s+Action Items/m);
    expect(wiki).toMatch(/^h2\.\s+Decisions/m);
    expect(wiki).toMatch(/^h2\.\s+Open Questions/m);
    expect(wiki).toMatch(/^h2\.\s+Summary/m);
    expect(wiki).toMatch(/^h2\.\s+Attendees/m);
  });

  it("does not use markdown '#' headers (cross-format guard)", () => {
    const wiki = formatConfluence(sampleResult);
    expect(wiki).not.toMatch(/^#+\s/m);
  });
});

describe("formatConfluence — AC2 task-list markup for action items", () => {
  it("renders each action item as a task-list line", () => {
    const wiki = formatConfluence(sampleResult);
    expect(wiki).toContain("[] Send follow-up email to design team");
    expect(wiki).toContain("[] Review PR #42");
    expect(wiki).toContain("[] Schedule kickoff");
  });

  it("does not render markdown checkbox '- [ ]' (cross-format guard)", () => {
    const wiki = formatConfluence(sampleResult);
    expect(wiki).not.toMatch(/- \[ \]/);
  });

  it("includes owner / due / priority alongside each task", () => {
    const wiki = formatConfluence(sampleResult);
    expect(wiki).toMatch(/Send follow-up email to design team.*Alice.*2026-05-01.*high/s);
  });
});

describe("formatConfluence — AC3 bullet lists use '*'", () => {
  it("renders decisions as '* ' bullets at top level", () => {
    const wiki = formatConfluence(sampleResult);
    expect(wiki).toMatch(/^\* Ship v1 next Friday/m);
    expect(wiki).toMatch(/^\* Drop the Confluence export/m);
  });

  it("renders open questions as '* ' bullets", () => {
    const wiki = formatConfluence(sampleResult);
    expect(wiki).toMatch(/^\* Who owns the migration\?/m);
    expect(wiki).toMatch(/^\* Do we need a feature flag/m);
  });

  it("renders attendees as '* ' bullets with name and topic count", () => {
    const wiki = formatConfluence(sampleResult);
    expect(wiki).toMatch(/^\* Alice/m);
    expect(wiki).toMatch(/^\* Bob/m);
    expect(wiki).toContain("412");
    expect(wiki).toContain("287");
  });
});

describe("formatConfluence — edge cases", () => {
  it("renders all section headers when collections are empty", () => {
    const wiki = formatConfluence(minimalResult);
    expect(wiki).toMatch(/^h2\.\s+Action Items/m);
    expect(wiki).toMatch(/^h2\.\s+Decisions/m);
    expect(wiki).toMatch(/^h2\.\s+Open Questions/m);
    expect(wiki).toMatch(/^h2\.\s+Summary/m);
    expect(wiki).toMatch(/^h2\.\s+Attendees/m);
  });

  it("includes summary text in the minimal fixture", () => {
    const wiki = formatConfluence(minimalResult);
    expect(wiki).toContain(minimalResult.summary);
  });
});
