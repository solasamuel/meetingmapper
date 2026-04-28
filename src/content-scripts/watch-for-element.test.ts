// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { watchForElement } from "./watch-for-element.js";

beforeEach(() => {
  document.body.innerHTML = "";
});

async function flushMutations(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("watchForElement", () => {
  it("fires onAppear immediately when the element already exists at start", () => {
    const target = document.createElement("div");
    target.id = "now";
    document.body.appendChild(target);

    const onAppear = vi.fn();
    const watcher = watchForElement((doc) => doc.querySelector("#now"), {
      onAppear,
    });

    expect(onAppear).toHaveBeenCalledTimes(1);
    expect(onAppear).toHaveBeenCalledWith(target);
    watcher.disconnect();
  });

  it("fires onAppear when the element is added later", async () => {
    const onAppear = vi.fn();
    const watcher = watchForElement((doc) => doc.querySelector("#late"), {
      onAppear,
    });
    expect(onAppear).not.toHaveBeenCalled();

    const target = document.createElement("div");
    target.id = "late";
    document.body.appendChild(target);
    await flushMutations();

    expect(onAppear).toHaveBeenCalledTimes(1);
    expect(onAppear).toHaveBeenCalledWith(target);
    watcher.disconnect();
  });

  it("fires onDisappear when the watched element is removed", async () => {
    const target = document.createElement("div");
    target.id = "soon-gone";
    document.body.appendChild(target);

    const onAppear = vi.fn();
    const onDisappear = vi.fn();
    const watcher = watchForElement((doc) => doc.querySelector("#soon-gone"), {
      onAppear,
      onDisappear,
    });
    expect(onAppear).toHaveBeenCalledTimes(1);
    expect(onDisappear).not.toHaveBeenCalled();

    target.remove();
    await flushMutations();

    expect(onDisappear).toHaveBeenCalledTimes(1);
    watcher.disconnect();
  });

  it("re-fires onAppear when the element reappears after being removed", async () => {
    const target = document.createElement("div");
    target.id = "toggle";
    document.body.appendChild(target);

    const onAppear = vi.fn();
    const onDisappear = vi.fn();
    const watcher = watchForElement((doc) => doc.querySelector("#toggle"), {
      onAppear,
      onDisappear,
    });
    expect(onAppear).toHaveBeenCalledTimes(1);

    target.remove();
    await flushMutations();
    expect(onDisappear).toHaveBeenCalledTimes(1);

    const replacement = document.createElement("div");
    replacement.id = "toggle";
    document.body.appendChild(replacement);
    await flushMutations();

    expect(onAppear).toHaveBeenCalledTimes(2);
    expect(onAppear).toHaveBeenLastCalledWith(replacement);
    watcher.disconnect();
  });

  it("does not re-fire onAppear when unrelated mutations happen", async () => {
    const target = document.createElement("div");
    target.id = "stable";
    document.body.appendChild(target);

    const onAppear = vi.fn();
    const watcher = watchForElement((doc) => doc.querySelector("#stable"), {
      onAppear,
    });
    expect(onAppear).toHaveBeenCalledTimes(1);

    document.body.appendChild(document.createElement("p"));
    document.body.appendChild(document.createElement("span"));
    await flushMutations();

    expect(onAppear).toHaveBeenCalledTimes(1);
    watcher.disconnect();
  });

  it("disconnect() stops further onAppear / onDisappear callbacks", async () => {
    const onAppear = vi.fn();
    const onDisappear = vi.fn();
    const watcher = watchForElement((doc) => doc.querySelector("#after"), {
      onAppear,
      onDisappear,
    });

    watcher.disconnect();

    const target = document.createElement("div");
    target.id = "after";
    document.body.appendChild(target);
    await flushMutations();

    expect(onAppear).not.toHaveBeenCalled();
    expect(onDisappear).not.toHaveBeenCalled();
  });

  it("onDisappear is optional", async () => {
    const target = document.createElement("div");
    target.id = "no-disappear-handler";
    document.body.appendChild(target);

    const onAppear = vi.fn();
    const watcher = watchForElement(
      (doc) => doc.querySelector("#no-disappear-handler"),
      { onAppear },
    );

    expect(() => target.remove()).not.toThrow();
    await flushMutations();

    watcher.disconnect();
  });
});
