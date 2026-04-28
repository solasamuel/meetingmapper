// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { Tabs } from "./Tabs.js";

const TWO_TABS = [
  { id: "a", label: "Alpha", panel: <div>alpha-content</div> },
  { id: "b", label: "Beta", panel: <div>beta-content</div> },
];

describe("Tabs — AC1 shell", () => {
  it("renders all tab labels", () => {
    render(<Tabs tabs={TWO_TABS} />);
    expect(screen.getByRole("tab", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Beta" })).toBeInTheDocument();
  });

  it("shows the first tab's panel by default", () => {
    render(<Tabs tabs={TWO_TABS} />);
    expect(screen.getByText("alpha-content")).toBeVisible();
    expect(screen.queryByText("beta-content")).not.toBeInTheDocument();
  });

  it("clicking a tab switches the visible panel", async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={TWO_TABS} />);
    await user.click(screen.getByRole("tab", { name: "Beta" }));
    expect(screen.getByText("beta-content")).toBeVisible();
    expect(screen.queryByText("alpha-content")).not.toBeInTheDocument();
  });

  it("uses ARIA tab pattern: tablist, tabs, tabpanel, aria-selected", () => {
    render(<Tabs tabs={TWO_TABS} />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    const [first, second] = screen.getAllByRole("tab");
    expect(first).toHaveAttribute("aria-selected", "true");
    expect(second).toHaveAttribute("aria-selected", "false");
  });

  it("ArrowRight on a focused tab moves selection to the next tab", async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={TWO_TABS} />);
    const [first, second] = screen.getAllByRole("tab");
    first!.focus();
    await user.keyboard("{ArrowRight}");
    expect(second).toHaveAttribute("aria-selected", "true");
  });

  it("ArrowLeft from the first tab wraps to the last", async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={TWO_TABS} />);
    const [first, second] = screen.getAllByRole("tab");
    first!.focus();
    await user.keyboard("{ArrowLeft}");
    expect(second).toHaveAttribute("aria-selected", "true");
  });

  it("Home jumps to the first tab; End jumps to the last", async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={TWO_TABS} />);
    const [first, second] = screen.getAllByRole("tab");
    second!.focus();
    await user.keyboard("{Home}");
    expect(first).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{End}");
    expect(second).toHaveAttribute("aria-selected", "true");
  });

  it("renders empty-state copy from a tab whose panel is empty", () => {
    const tabs = [
      { id: "a", label: "Alpha", panel: <p>nothing yet</p> },
    ];
    render(<Tabs tabs={tabs} />);
    expect(screen.getByText("nothing yet")).toBeInTheDocument();
  });
});
