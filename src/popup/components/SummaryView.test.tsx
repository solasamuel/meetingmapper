// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { SummaryView } from "./SummaryView.js";
import { sampleResult, minimalResult } from "../../exports/__fixtures__/sample-result.js";

describe("SummaryView", () => {
  it("renders the summary as a single paragraph", () => {
    render(<SummaryView summary={sampleResult.summary} />);
    const paragraph = screen.getByText(sampleResult.summary);
    expect(paragraph.tagName).toBe("P");
  });

  it("handles the minimal-result summary", () => {
    render(<SummaryView summary={minimalResult.summary} />);
    expect(screen.getByText(minimalResult.summary)).toBeInTheDocument();
  });

  it("renders empty-state when summary is an empty string", () => {
    render(<SummaryView summary="" />);
    expect(screen.getByText(/no summary/i)).toBeInTheDocument();
  });
});
