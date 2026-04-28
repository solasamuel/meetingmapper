// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { App } from "./App.js";

describe("App — smoke test", () => {
  it("renders without crashing and shows the product title", () => {
    render(<App />);
    expect(screen.getByText("MeetingMapper")).toBeInTheDocument();
  });

  it("displays the version string from package.json", () => {
    render(<App />);
    expect(screen.getByText(/^v\d+\.\d+\.\d+/)).toBeInTheDocument();
  });

  it("includes a placeholder describing how to use the extension", () => {
    render(<App />);
    expect(screen.getByText(/paste a transcript/i)).toBeInTheDocument();
  });
});
