import { describe, it, expect } from "vitest";
import { formatNotion } from "./notion.js";
import { sampleResult, minimalResult } from "./__fixtures__/sample-result.js";

describe("formatNotion — AC1 action items as '- [ ] task' checkboxes", () => {
  it("renders every action item as a markdown task checkbox", () => {
    const md = formatNotion(sampleResult);
    expect(md).toContain("- [ ] Send follow-up email to design team");
    expect(md).toContain("- [ ] Review PR #42");
    expect(md).toContain("- [ ] Schedule kickoff");
  });

  it("includes owner / due / priority alongside each task", () => {
    const md = formatNotion(sampleResult);
    expect(md).toMatch(/Send follow-up email to design team.*Alice.*2026-05-01.*high/s);
  });

  it("does not render any 'checked' boxes", () => {
    const md = formatNotion(sampleResult);
    expect(md).not.toMatch(/- \[x\]/i);
  });
});

describe("formatNotion — AC2 markdown headers", () => {
  it("uses '#' headings consistent with Notion paste behaviour", () => {
    const md = formatNotion(sampleResult);
    expect(md).toMatch(/^#\s+Meeting Notes/m);
    expect(md).toMatch(/^##\s+Action Items/m);
    expect(md).toMatch(/^##\s+Decisions/m);
    expect(md).toMatch(/^##\s+Open Questions/m);
    expect(md).toMatch(/^##\s+Summary/m);
    expect(md).toMatch(/^##\s+Attendees/m);
  });

  it("does not use Confluence h1./h2. syntax (cross-format guard)", () => {
    const md = formatNotion(sampleResult);
    expect(md).not.toMatch(/^h\d\./m);
  });

  it("renders decisions, questions, summary, and attendees from the fixture", () => {
    const md = formatNotion(sampleResult);
    expect(md).toContain("Ship v1 next Friday");
    expect(md).toContain("Bob");
    expect(md).toContain("Who owns the migration?");
    expect(md).toContain("The team aligned on shipping v1");
    expect(md).toContain("Alice");
    expect(md).toContain("412");
  });
});

describe("formatNotion — edge cases", () => {
  it("renders all section headers even when collections are empty", () => {
    const md = formatNotion(minimalResult);
    expect(md).toMatch(/^##\s+Action Items/m);
    expect(md).toMatch(/^##\s+Decisions/m);
    expect(md).toMatch(/^##\s+Open Questions/m);
    expect(md).toMatch(/^##\s+Summary/m);
    expect(md).toMatch(/^##\s+Attendees/m);
  });

  it("includes the summary text from minimalResult", () => {
    const md = formatNotion(minimalResult);
    expect(md).toContain(minimalResult.summary);
  });
});
