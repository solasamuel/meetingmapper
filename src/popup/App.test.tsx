// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { App } from "./App.js";
import { sampleResult, minimalResult } from "../exports/__fixtures__/sample-result.js";
import type { ExtractionResult } from "../extraction/schema.js";
import type { ExtractInput } from "./run-extraction.js";

const noopExtract = vi.fn().mockResolvedValue(sampleResult);
const emptyBuffer = { entries: [], loading: false };

describe("App — initial render (no result yet)", () => {
  it("renders the product title", () => {
    render(<App extractFn={noopExtract} meetingBuffer={emptyBuffer} />);
    expect(screen.getByText("MeetingMapper")).toBeInTheDocument();
  });

  it("displays the version string from package.json", () => {
    render(<App extractFn={noopExtract} meetingBuffer={emptyBuffer} />);
    expect(screen.getByText(/^v\d+\.\d+\.\d+/)).toBeInTheDocument();
  });

  it("shows both the meeting button and the PasteInput when no result", () => {
    render(<App extractFn={noopExtract} meetingBuffer={emptyBuffer} />);
    expect(screen.getByLabelText(/paste transcript/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /process transcript/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /process current meeting/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("treats result=null the same as no result", () => {
    render(<App result={null} extractFn={noopExtract} meetingBuffer={emptyBuffer} />);
    expect(screen.getByLabelText(/paste transcript/i)).toBeInTheDocument();
  });
});

describe("App — with result prop set externally", () => {
  it("renders a tablist with all five tabs when attendees is non-empty", () => {
    render(
      <App
        result={sampleResult}
        extractFn={noopExtract}
        meetingBuffer={emptyBuffer}
      />,
    );
    expect(screen.getByRole("tab", { name: "Action Items" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Decisions" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Open Questions" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Summary" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Attendees" })).toBeInTheDocument();
  });

  it("hides the Attendees tab when attendees array is empty", () => {
    render(
      <App
        result={minimalResult}
        extractFn={noopExtract}
        meetingBuffer={emptyBuffer}
      />,
    );
    expect(screen.queryByRole("tab", { name: "Attendees" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Action Items" })).toBeInTheDocument();
  });

  it("hides the input view when a result is showing", () => {
    render(
      <App
        result={sampleResult}
        extractFn={noopExtract}
        meetingBuffer={emptyBuffer}
      />,
    );
    expect(screen.queryByLabelText(/paste transcript/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /process current meeting/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the ExportBar with all four format buttons when a result is present", () => {
    render(
      <App
        result={sampleResult}
        extractFn={noopExtract}
        meetingBuffer={emptyBuffer}
      />,
    );
    expect(screen.getByRole("button", { name: /notion/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confluence/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /slack/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /email/i })).toBeInTheDocument();
  });

  it("clicking an ExportBar button copies the matching format and shows a toast", async () => {
    const user = userEvent.setup();
    const copy = vi.fn().mockResolvedValue(undefined);
    const formatters = {
      notion: vi.fn(() => "## n"),
      confluence: vi.fn(() => "h2. c"),
      slack: vi.fn(() => "*s*"),
      email: vi.fn(() => ({ subject: "s", body: "e" })),
    };

    render(
      <App
        result={sampleResult}
        extractFn={noopExtract}
        formatters={formatters}
        copy={copy}
        meetingBuffer={emptyBuffer}
      />,
    );

    await user.click(screen.getByRole("button", { name: /notion/i }));

    expect(formatters.notion).toHaveBeenCalledWith(sampleResult);
    expect(copy).toHaveBeenCalledWith("## n");
    expect(await screen.findByRole("status")).toHaveTextContent(/copied/i);
  });
});

describe("App — paste → extract flow", () => {
  it("calls extractFn with the textarea text when 'Process transcript' is clicked", async () => {
    const user = userEvent.setup();
    const extractFn = vi.fn<(input: ExtractInput) => Promise<ExtractionResult>>(
      () => new Promise(() => {}),
    );

    render(<App extractFn={extractFn} meetingBuffer={emptyBuffer} />);

    await user.type(
      screen.getByLabelText(/paste transcript/i),
      "Alice: Hello team.",
    );
    await user.click(screen.getByRole("button", { name: /process transcript/i }));

    expect(extractFn).toHaveBeenCalledWith("Alice: Hello team.");
  });

  it("shows the tabs view once extractFn resolves with a result", async () => {
    const user = userEvent.setup();
    const extractFn = vi
      .fn<(input: ExtractInput) => Promise<ExtractionResult>>()
      .mockResolvedValue(sampleResult);

    render(<App extractFn={extractFn} meetingBuffer={emptyBuffer} />);
    await user.type(screen.getByLabelText(/paste transcript/i), "Alice: hi");
    await user.click(screen.getByRole("button", { name: /process transcript/i }));

    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Action Items" })).toBeInTheDocument(),
    );
    expect(screen.getByText("Send follow-up email to design team")).toBeInTheDocument();
  });

  it("shows an error banner when extractFn rejects", async () => {
    const user = userEvent.setup();
    const extractFn = vi
      .fn<(input: ExtractInput) => Promise<ExtractionResult>>()
      .mockRejectedValue(new Error("api key missing"));

    render(<App extractFn={extractFn} meetingBuffer={emptyBuffer} />);
    await user.type(screen.getByLabelText(/paste transcript/i), "Alice: hi");
    await user.click(screen.getByRole("button", { name: /process transcript/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/api key missing/),
    );
  });

  it("'New transcript' button after a result returns to the input view", async () => {
    const user = userEvent.setup();
    const extractFn = vi
      .fn<(input: ExtractInput) => Promise<ExtractionResult>>()
      .mockResolvedValue(sampleResult);

    render(<App extractFn={extractFn} meetingBuffer={emptyBuffer} />);
    await user.type(screen.getByLabelText(/paste transcript/i), "Alice: hi");
    await user.click(screen.getByRole("button", { name: /process transcript/i }));

    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Action Items" })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: /new transcript/i }));

    expect(screen.getByLabelText(/paste transcript/i)).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });
});

describe("App — meeting → extract flow (MM-203)", () => {
  it("'Process current meeting' is disabled when buffer is empty", () => {
    render(<App extractFn={noopExtract} meetingBuffer={emptyBuffer} />);
    expect(
      screen.getByRole("button", { name: /process current meeting/i }),
    ).toBeDisabled();
  });

  it("'Process current meeting' is enabled when buffer has entries", () => {
    const buffer = {
      entries: [{ speaker: "Alice", text: "Hello.", timestamp: null }],
      loading: false,
    };
    render(<App extractFn={noopExtract} meetingBuffer={buffer} />);
    expect(
      screen.getByRole("button", { name: /process current meeting/i }),
    ).toBeEnabled();
  });

  it("clicking 'Process current meeting' calls extractFn with the buffer entries", async () => {
    const user = userEvent.setup();
    const extractFn = vi.fn<(input: ExtractInput) => Promise<ExtractionResult>>(
      () => new Promise(() => {}),
    );
    const buffer = {
      entries: [
        { speaker: "Alice", text: "Hello.", timestamp: null },
        { speaker: "Bob", text: "Hi.", timestamp: null },
      ],
      loading: false,
    };

    render(<App extractFn={extractFn} meetingBuffer={buffer} />);

    await user.click(screen.getByRole("button", { name: /process current meeting/i }));

    expect(extractFn).toHaveBeenCalledWith(buffer.entries);
  });

  it("renders tabs once the meeting extraction resolves", async () => {
    const user = userEvent.setup();
    const extractFn = vi
      .fn<(input: ExtractInput) => Promise<ExtractionResult>>()
      .mockResolvedValue(sampleResult);
    const buffer = {
      entries: [{ speaker: "Alice", text: "Hello.", timestamp: null }],
      loading: false,
    };

    render(<App extractFn={extractFn} meetingBuffer={buffer} />);
    await user.click(screen.getByRole("button", { name: /process current meeting/i }));

    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Action Items" })).toBeInTheDocument(),
    );
  });
});
