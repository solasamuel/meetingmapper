// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ActionItemsView } from "./ActionItemsView.js";
import { sampleResult, minimalResult } from "../../exports/__fixtures__/sample-result.js";

describe("ActionItemsView — AC2 task/owner/due/priority + checkbox + badge", () => {
  it("renders task, owner, due date, and priority for each item", () => {
    render(<ActionItemsView items={sampleResult.action_items} />);
    expect(screen.getByText("Send follow-up email to design team")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("2026-05-01")).toBeInTheDocument();
  });

  it("shows 'Unassigned' when owner is null", () => {
    render(<ActionItemsView items={sampleResult.action_items} />);
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("shows 'No date' when due is null", () => {
    render(<ActionItemsView items={sampleResult.action_items} />);
    const noDateCells = screen.getAllByText("No date");
    expect(noDateCells.length).toBeGreaterThan(0);
  });

  it("renders a checkbox for each item, all unchecked", () => {
    render(<ActionItemsView items={sampleResult.action_items} />);
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(sampleResult.action_items.length);
    for (const box of boxes) expect(box).not.toBeChecked();
  });

  it("priority badge has a class distinguishing high / medium / low", () => {
    const { container } = render(<ActionItemsView items={sampleResult.action_items} />);
    expect(container.querySelector(".priority-high")).toBeInTheDocument();
    expect(container.querySelector(".priority-medium")).toBeInTheDocument();
    expect(container.querySelector(".priority-low")).toBeInTheDocument();
  });

  it("renders empty-state copy when there are no items", () => {
    render(<ActionItemsView items={minimalResult.action_items} />);
    expect(screen.getByText(/no action items/i)).toBeInTheDocument();
  });
});
