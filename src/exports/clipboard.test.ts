import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { copyToClipboard, ClipboardUnavailableError } from "./clipboard.js";

describe("copyToClipboard", () => {
  const originalClipboard = (globalThis.navigator as { clipboard?: unknown } | undefined)?.clipboard;

  beforeEach(() => {
    if (!globalThis.navigator) {
      Object.defineProperty(globalThis, "navigator", {
        value: {},
        configurable: true,
        writable: true,
      });
    }
  });

  afterEach(() => {
    if (originalClipboard !== undefined) {
      Object.defineProperty(globalThis.navigator, "clipboard", {
        value: originalClipboard,
        configurable: true,
        writable: true,
      });
    } else {
      delete (globalThis.navigator as { clipboard?: unknown }).clipboard;
    }
  });

  it("calls navigator.clipboard.writeText with the supplied string", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true,
    });

    await copyToClipboard("hello world");

    expect(writeText).toHaveBeenCalledWith("hello world");
  });

  it("throws ClipboardUnavailableError when navigator.clipboard is missing", async () => {
    delete (globalThis.navigator as { clipboard?: unknown }).clipboard;

    await expect(copyToClipboard("anything")).rejects.toBeInstanceOf(
      ClipboardUnavailableError,
    );
  });

  it("propagates writeText rejections so callers can surface failures", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true,
    });

    await expect(copyToClipboard("anything")).rejects.toThrow(/denied/);
  });
});
