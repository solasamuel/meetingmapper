// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { App } from "./App.js";
import { sampleResult, minimalResult } from "../exports/__fixtures__/sample-result.js";

describe("App — empty state", () => {
  it("renders the product title", () => {
    render(<App />);
    expect(screen.getByText("MeetingMapper")).toBeInTheDocument();
  });

  it("displays the version string from package.json", () => {
    render(<App />);
    expect(screen.getByText(/^v\d+\.\d+\.\d+/)).toBeInTheDocument();
  });

  it("shows the empty-state copy when no result is provided", () => {
    render(<App />);
    expect(screen.getByText(/paste a transcript/i)).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("treats result=null the same as no result", () => {
    render(<App result={null} />);
    expect(screen.getByText(/paste a transcript/i)).toBeInTheDocument();
  });
});

describe("App — with result", () => {
  it("renders a tablist with all five tabs when attendees is non-empty", () => {
    render(<App result={sampleResult} />);
    expect(screen.getByRole("tab", { name: "Action Items" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Decisions" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Open Questions" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Summary" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Attendees" })).toBeInTheDocument();
  });

  it("hides the Attendees tab when attendees array is empty (AC4)", () => {
    render(<App result={minimalResult} />);
    expect(screen.queryByRole("tab", { name: "Attendees" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Action Items" })).toBeInTheDocument();
  });

  it("Action Items tab is selected by default and renders the first item", () => {
    render(<App result={sampleResult} />);
    expect(screen.getByText("Send follow-up email to design team")).toBeInTheDocument();
  });

  it("hides the empty-state copy when a result is provided", () => {
    render(<App result={sampleResult} />);
    expect(screen.queryByText(/paste a transcript/i)).not.toBeInTheDocument();
  });
});
