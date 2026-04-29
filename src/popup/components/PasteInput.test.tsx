// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { PasteInput } from "./PasteInput.js";

describe("PasteInput — AC1 textarea", () => {
  it("renders a textarea labelled 'Paste transcript'", () => {
    render(<PasteInput onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/paste transcript/i)).toBeInTheDocument();
  });

  it("textarea is a <textarea> element (multi-line input)", () => {
    render(<PasteInput onSubmit={vi.fn()} />);
    const input = screen.getByLabelText(/paste transcript/i);
    expect(input.tagName).toBe("TEXTAREA");
  });
});

describe("PasteInput — AC4 submit enabled only when non-empty", () => {
  it("submit button is disabled when textarea is empty", () => {
    render(<PasteInput onSubmit={vi.fn()} />);
    expect(screen.getByRole("button", { name: /process/i })).toBeDisabled();
  });

  it("submit button is disabled when textarea has only whitespace", async () => {
    const user = userEvent.setup();
    render(<PasteInput onSubmit={vi.fn()} />);
    await user.type(screen.getByLabelText(/paste transcript/i), "   \n  ");
    expect(screen.getByRole("button", { name: /process/i })).toBeDisabled();
  });

  it("submit button is enabled once non-whitespace text is typed", async () => {
    const user = userEvent.setup();
    render(<PasteInput onSubmit={vi.fn()} />);
    await user.type(screen.getByLabelText(/paste transcript/i), "Alice: Hello");
    expect(screen.getByRole("button", { name: /process/i })).toBeEnabled();
  });

  it("submit button becomes disabled again if textarea is cleared", async () => {
    const user = userEvent.setup();
    render(<PasteInput onSubmit={vi.fn()} />);
    const ta = screen.getByLabelText(/paste transcript/i);
    await user.type(ta, "abc");
    await user.clear(ta);
    expect(screen.getByRole("button", { name: /process/i })).toBeDisabled();
  });
});

describe("PasteInput — submit calls onSubmit with the trimmed text", () => {
  it("clicking submit invokes onSubmit with the textarea's text", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PasteInput onSubmit={onSubmit} />);

    await user.type(
      screen.getByLabelText(/paste transcript/i),
      "Alice: Hello{Enter}Bob: Hi",
    );
    await user.click(screen.getByRole("button", { name: /process/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith("Alice: Hello\nBob: Hi");
  });

  it("disabled button does not invoke onSubmit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PasteInput onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: /process/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("PasteInput — busy state", () => {
  it("disables the textarea and button when busy=true", () => {
    render(<PasteInput onSubmit={vi.fn()} busy />);
    expect(screen.getByLabelText(/paste transcript/i)).toBeDisabled();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows a busy label on the button when busy=true", () => {
    render(<PasteInput onSubmit={vi.fn()} busy />);
    expect(screen.getByRole("button", { name: /processing/i })).toBeInTheDocument();
  });
});
