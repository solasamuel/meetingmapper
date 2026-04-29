// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { ExportBar } from "./ExportBar.js";
import { sampleResult } from "../../exports/__fixtures__/sample-result.js";

function setup() {
  const formatters = {
    notion: vi.fn(() => "## Notion output"),
    confluence: vi.fn(() => "h2. Confluence output"),
    slack: vi.fn(() => "*Slack output*"),
    email: vi.fn(() => ({ subject: "S", body: "Email body" })),
  };
  const copy = vi.fn().mockResolvedValue(undefined);
  return { formatters, copy };
}

describe("ExportBar — buttons", () => {
  it("renders one button per export format", () => {
    const { formatters, copy } = setup();
    render(
      <ExportBar
        result={sampleResult}
        formatters={formatters}
        copy={copy}
      />,
    );
    expect(screen.getByRole("button", { name: /notion/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confluence/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /slack/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /email/i })).toBeInTheDocument();
  });
});

describe("ExportBar — click flow", () => {
  it("clicking Notion calls notion formatter then copies the markdown", async () => {
    const user = userEvent.setup();
    const { formatters, copy } = setup();
    render(
      <ExportBar
        result={sampleResult}
        formatters={formatters}
        copy={copy}
      />,
    );

    await user.click(screen.getByRole("button", { name: /notion/i }));

    expect(formatters.notion).toHaveBeenCalledWith(sampleResult);
    expect(copy).toHaveBeenCalledWith("## Notion output");
  });

  it("clicking Slack calls slack formatter and copies", async () => {
    const user = userEvent.setup();
    const { formatters, copy } = setup();
    render(
      <ExportBar
        result={sampleResult}
        formatters={formatters}
        copy={copy}
      />,
    );

    await user.click(screen.getByRole("button", { name: /slack/i }));

    expect(formatters.slack).toHaveBeenCalledWith(sampleResult);
    expect(copy).toHaveBeenCalledWith("*Slack output*");
  });

  it("clicking Email copies the body (not the subject) to the clipboard", async () => {
    const user = userEvent.setup();
    const { formatters, copy } = setup();
    render(
      <ExportBar
        result={sampleResult}
        formatters={formatters}
        copy={copy}
      />,
    );

    await user.click(screen.getByRole("button", { name: /email/i }));

    expect(copy).toHaveBeenCalledWith("Email body");
  });
});

describe("ExportBar — toast", () => {
  it("shows a 'Copied!' toast after a successful copy (AC3)", async () => {
    const user = userEvent.setup();
    const { formatters, copy } = setup();
    render(
      <ExportBar
        result={sampleResult}
        formatters={formatters}
        copy={copy}
      />,
    );

    await user.click(screen.getByRole("button", { name: /notion/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/copied/i);
  });

  it("does not show a toast if copy fails", async () => {
    const user = userEvent.setup();
    const { formatters } = setup();
    const copy = vi.fn().mockRejectedValue(new Error("clipboard denied"));
    render(
      <ExportBar
        result={sampleResult}
        formatters={formatters}
        copy={copy}
      />,
    );

    await user.click(screen.getByRole("button", { name: /notion/i }));

    await waitFor(() => expect(copy).toHaveBeenCalled());
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("ExportBar — default format from settings", () => {
  it("when defaultFormat is 'slack', the Slack button has aria-pressed='true'", () => {
    const { formatters, copy } = setup();
    render(
      <ExportBar
        result={sampleResult}
        formatters={formatters}
        copy={copy}
        defaultFormat="slack"
      />,
    );
    expect(screen.getByRole("button", { name: /slack/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /notion/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
