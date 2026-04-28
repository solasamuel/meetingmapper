// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { waitForElement } from "./wait-for-element.js";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("waitForElement", () => {
  it("resolves immediately when the element already exists", async () => {
    const target = document.createElement("div");
    target.id = "caption-region";
    document.body.appendChild(target);

    const found = await waitForElement(
      (doc) => doc.querySelector("#caption-region"),
      { intervalMs: 10, timeoutMs: 1000 },
    );

    expect(found).toBe(target);
  });

  it("resolves once the element appears asynchronously", async () => {
    const promise = waitForElement(
      (doc) => doc.querySelector("#late"),
      { intervalMs: 10, timeoutMs: 1000 },
    );

    setTimeout(() => {
      const el = document.createElement("div");
      el.id = "late";
      document.body.appendChild(el);
    }, 50);

    const found = await promise;
    expect(found.id).toBe("late");
  });

  it("rejects with a timeout error when the element never appears", async () => {
    await expect(
      waitForElement(() => null, { intervalMs: 10, timeoutMs: 50 }),
    ).rejects.toThrow(/timed out/);
  });
});
