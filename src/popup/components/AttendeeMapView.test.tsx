// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AttendeeMapView } from "./AttendeeMapView.js";
import { sampleResult, minimalResult } from "../../exports/__fixtures__/sample-result.js";

describe("AttendeeMapView — AC4", () => {
  it("renders each attendee with name, topics, and word count", () => {
    render(<AttendeeMapView attendees={sampleResult.attendees} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText(/412/)).toBeInTheDocument();
    expect(screen.getByText(/287/)).toBeInTheDocument();
    expect(screen.getByText(/roadmap/)).toBeInTheDocument();
    expect(screen.getByText(/release/)).toBeInTheDocument();
  });

  it("renders a word-count bar whose width is proportional to the max word_count", () => {
    const { container } = render(<AttendeeMapView attendees={sampleResult.attendees} />);
    const bars = container.querySelectorAll<HTMLElement>(".word-count-bar-fill");
    expect(bars).toHaveLength(sampleResult.attendees.length);

    // Alice has 412 words (the max in the fixture), so her bar fills 100%.
    const aliceBar = bars[0]!;
    expect(aliceBar.style.width).toBe("100%");

    // Bob has 287 words; expect ~70% (287/412 = 0.6966)
    const bobBar = bars[1]!;
    const widthPct = parseFloat(bobBar.style.width);
    expect(widthPct).toBeGreaterThan(65);
    expect(widthPct).toBeLessThan(75);
  });

  it("uses role=progressbar with aria attributes for the word-count bar", () => {
    render(<AttendeeMapView attendees={sampleResult.attendees} />);
    const bars = screen.getAllByRole("progressbar");
    expect(bars).toHaveLength(sampleResult.attendees.length);
    expect(bars[0]).toHaveAttribute("aria-valuemax", "412");
    expect(bars[0]).toHaveAttribute("aria-valuenow", "412");
    expect(bars[1]).toHaveAttribute("aria-valuenow", "287");
  });

  it("renders empty-state when attendees array is empty", () => {
    render(<AttendeeMapView attendees={minimalResult.attendees} />);
    expect(screen.getByText(/no attendees/i)).toBeInTheDocument();
  });
});
