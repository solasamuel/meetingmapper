// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { DecisionsView } from "./DecisionsView.js";
import { sampleResult, minimalResult } from "../../exports/__fixtures__/sample-result.js";

describe("DecisionsView", () => {
  it("renders decision text and attribution when made_by is present", () => {
    render(<DecisionsView decisions={sampleResult.decisions} />);
    expect(screen.getByText("Ship v1 next Friday")).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
  });

  it("renders decision text without attribution when made_by is null", () => {
    render(<DecisionsView decisions={sampleResult.decisions} />);
    expect(screen.getByText("Drop the Confluence export from v1")).toBeInTheDocument();
  });

  it("renders empty-state when decisions is empty", () => {
    render(<DecisionsView decisions={minimalResult.decisions} />);
    expect(screen.getByText(/no decisions/i)).toBeInTheDocument();
  });
});
