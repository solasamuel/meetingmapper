// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { App } from "./App.js";
import { sampleResult, minimalResult } from "../exports/__fixtures__/sample-result.js";
import type { ExtractionResult } from "../extraction/schema.js";

const noopExtract = vi.fn().mockResolvedValue(sampleResult);

describe("App — initial render (no result yet)", () => {
  it("renders the product title", () => {
    render(<App extractFn={noopExtract} />);
    expect(screen.getByText("MeetingMapper")).toBeInTheDocument();
  });

  it("displays the version string from package.json", () => {
    render(<App extractFn={noopExtract} />);
    expect(screen.getByText(/^v\d+\.\d+\.\d+/)).toBeInTheDocument();
  });

  it("shows the PasteInput when no result is provided", () => {
    render(<App extractFn={noopExtract} />);
    expect(screen.getByLabelText(/paste transcript/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /process/i })).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("treats result=null the same as no result", () => {
    render(<App result={null} extractFn={noopExtract} />);
    expect(screen.getByLabelText(/paste transcript/i)).toBeInTheDocument();
  });
});

describe("App — with result prop set externally", () => {
  it("renders a tablist with all five tabs when attendees is non-empty", () => {
    render(<App result={sampleResult} extractFn={noopExtract} />);
    expect(screen.getByRole("tab", { name: "Action Items" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Decisions" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Open Questions" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Summary" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Attendees" })).toBeInTheDocument();
  });

  it("hides the Attendees tab when attendees array is empty", () => {
    render(<App result={minimalResult} extractFn={noopExtract} />);
    expect(screen.queryByRole("tab", { name: "Attendees" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Action Items" })).toBeInTheDocument();
  });

  it("hides the PasteInput when a result is showing", () => {
    render(<App result={sampleResult} extractFn={noopExtract} />);
    expect(screen.queryByLabelText(/paste transcript/i)).not.toBeInTheDocument();
  });
});

describe("App — paste → extract flow", () => {
  it("calls extractFn with the textarea text when Process is clicked", async () => {
    const user = userEvent.setup();
    const extractFn = vi.fn<(input: string) => Promise<ExtractionResult>>(
      () => new Promise(() => {}),
    );

    render(<App extractFn={extractFn} />);

    await user.type(
      screen.getByLabelText(/paste transcript/i),
      "Alice: Hello team.",
    );
    await user.click(screen.getByRole("button", { name: /process/i }));

    expect(extractFn).toHaveBeenCalledWith("Alice: Hello team.");
  });

  it("shows the tabs view once extractFn resolves with a result", async () => {
    const user = userEvent.setup();
    const extractFn = vi.fn<(input: string) => Promise<ExtractionResult>>().mockResolvedValue(
      sampleResult,
    );

    render(<App extractFn={extractFn} />);
    await user.type(screen.getByLabelText(/paste transcript/i), "Alice: hi");
    await user.click(screen.getByRole("button", { name: /process/i }));

    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Action Items" })).toBeInTheDocument(),
    );
    expect(screen.getByText("Send follow-up email to design team")).toBeInTheDocument();
  });

  it("shows an error banner when extractFn rejects", async () => {
    const user = userEvent.setup();
    const extractFn = vi
      .fn<(input: string) => Promise<ExtractionResult>>()
      .mockRejectedValue(new Error("api key missing"));

    render(<App extractFn={extractFn} />);
    await user.type(screen.getByLabelText(/paste transcript/i), "Alice: hi");
    await user.click(screen.getByRole("button", { name: /process/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/api key missing/),
    );
  });

  it("'New transcript' button after a result returns to the PasteInput view", async () => {
    const user = userEvent.setup();
    const extractFn = vi.fn<(input: string) => Promise<ExtractionResult>>().mockResolvedValue(
      sampleResult,
    );

    render(<App extractFn={extractFn} />);
    await user.type(screen.getByLabelText(/paste transcript/i), "Alice: hi");
    await user.click(screen.getByRole("button", { name: /process/i }));

    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Action Items" })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: /new transcript/i }));

    expect(screen.getByLabelText(/paste transcript/i)).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });
});
