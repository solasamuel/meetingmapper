// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { ProcessMeetingButton } from "./ProcessMeetingButton.js";

describe("ProcessMeetingButton — AC2 disabled when empty", () => {
  it("button is disabled when entries is empty", () => {
    render(<ProcessMeetingButton entries={[]} onClick={vi.fn()} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("button is enabled when there is at least one entry", () => {
    render(
      <ProcessMeetingButton
        entries={[{ speaker: "Alice", text: "hi", timestamp: null }]}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByRole("button")).toBeEnabled();
  });
});

describe("ProcessMeetingButton — entry count visibility", () => {
  it("shows the entry count next to the button", () => {
    render(
      <ProcessMeetingButton
        entries={[
          { speaker: "Alice", text: "one", timestamp: null },
          { speaker: "Bob", text: "two", timestamp: null },
          { speaker: "Alice", text: "three", timestamp: null },
        ]}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByText(/3 captions captured/i)).toBeInTheDocument();
  });

  it("uses singular when exactly 1 caption", () => {
    render(
      <ProcessMeetingButton
        entries={[{ speaker: "Alice", text: "one", timestamp: null }]}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByText(/1 caption captured/i)).toBeInTheDocument();
  });

  it("does not show a count when there are no captions", () => {
    render(<ProcessMeetingButton entries={[]} onClick={vi.fn()} />);
    expect(screen.queryByText(/captions captured/i)).not.toBeInTheDocument();
  });
});

describe("ProcessMeetingButton — click and busy", () => {
  it("clicking calls onClick (disabled button does not)", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <ProcessMeetingButton
        entries={[{ speaker: null, text: "x", timestamp: null }]}
        onClick={onClick}
      />,
    );
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disabled button does not invoke onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ProcessMeetingButton entries={[]} onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("busy=true disables the button and shows 'Processing…'", () => {
    render(
      <ProcessMeetingButton
        entries={[{ speaker: null, text: "x", timestamp: null }]}
        onClick={vi.fn()}
        busy
      />,
    );
    const btn = screen.getByRole("button", { name: /processing/i });
    expect(btn).toBeDisabled();
  });
});
