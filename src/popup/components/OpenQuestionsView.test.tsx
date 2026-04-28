// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { OpenQuestionsView } from "./OpenQuestionsView.js";
import { sampleResult, minimalResult } from "../../exports/__fixtures__/sample-result.js";

describe("OpenQuestionsView", () => {
  it("renders each open question as a list item", () => {
    render(<OpenQuestionsView questions={sampleResult.open_questions} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(sampleResult.open_questions.length);
    expect(screen.getByText("Who owns the migration?")).toBeInTheDocument();
    expect(screen.getByText("Do we need a feature flag for the rollout?")).toBeInTheDocument();
  });

  it("renders empty-state when there are no open questions", () => {
    render(<OpenQuestionsView questions={minimalResult.open_questions} />);
    expect(screen.getByText(/no open questions/i)).toBeInTheDocument();
  });
});
