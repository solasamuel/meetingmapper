// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { Options } from "./Options.js";

type StorageArea = {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
};

function installChromeMock(initial: Record<string, unknown> = {}): { local: StorageArea } {
  const local: StorageArea = {
    get: vi.fn().mockResolvedValue(initial),
    set: vi.fn().mockResolvedValue(undefined),
  };
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: { local, sync: { get: vi.fn(), set: vi.fn() } },
  };
  return { local };
}

beforeEach(() => {
  delete (globalThis as { chrome?: unknown }).chrome;
});

describe("Options — initial render", () => {
  it("renders the API key field as a password input by default (AC1)", async () => {
    installChromeMock();
    render(<Options />);
    const input = await screen.findByLabelText(/anthropic api key/i);
    expect(input).toHaveAttribute("type", "password");
  });

  it("renders the default-export selector with all four formats", async () => {
    installChromeMock();
    render(<Options />);
    const select = await screen.findByLabelText(/default export format/i);
    const options = Array.from(select.querySelectorAll("option")).map((o) => o.value);
    expect(options).toEqual(expect.arrayContaining(["notion", "confluence", "slack", "email"]));
  });

  it("loads existing settings from chrome.storage.local on mount", async () => {
    installChromeMock({
      settings: { apiKey: "stored-key-123", defaultExportFormat: "slack" },
    });
    render(<Options />);

    const input = await screen.findByLabelText(/anthropic api key/i);
    await waitFor(() => expect(input).toHaveValue("stored-key-123"));

    const select = screen.getByLabelText(/default export format/i);
    expect(select).toHaveValue("slack");
  });
});

describe("Options — show/hide key (AC1)", () => {
  it("toggling 'Show' switches the API key input to type=text and back", async () => {
    installChromeMock();
    const user = userEvent.setup();
    render(<Options />);

    const input = (await screen.findByLabelText(/anthropic api key/i)) as HTMLInputElement;
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /show/i }));
    expect(input).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /hide/i }));
    expect(input).toHaveAttribute("type", "password");
  });
});

describe("Options — save (AC2 + AC3)", () => {
  it("saves the form values to chrome.storage.local on submit", async () => {
    const { local } = installChromeMock();
    const user = userEvent.setup();
    render(<Options />);

    const input = await screen.findByLabelText(/anthropic api key/i);
    await user.clear(input);
    await user.type(input, "new-key-xyz");

    const select = screen.getByLabelText(/default export format/i);
    await user.selectOptions(select, "email");

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(local.set).toHaveBeenCalledWith({
        settings: { apiKey: "new-key-xyz", defaultExportFormat: "email" },
      });
    });
  });

  it("shows a 'Saved' confirmation after a successful save", async () => {
    installChromeMock();
    const user = userEvent.setup();
    render(<Options />);

    await screen.findByLabelText(/anthropic api key/i);
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText(/saved/i)).toBeInTheDocument();
  });
});
