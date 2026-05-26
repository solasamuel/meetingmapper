// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCurrentMeetingBuffer } from "./use-current-meeting-buffer.js";

type StorageArea = {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
};

function installChromeMock(opts: {
  activeTabId?: number;
  stored?: Record<string, unknown>;
}) {
  const session: StorageArea = {
    get: vi.fn().mockResolvedValue(opts.stored ?? {}),
    set: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  };
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: { session },
    tabs: {
      query: vi
        .fn()
        .mockResolvedValue(
          opts.activeTabId === undefined ? [] : [{ id: opts.activeTabId }],
        ),
    },
  };
  return session;
}

beforeEach(() => {
  delete (globalThis as { chrome?: unknown }).chrome;
});

describe("useCurrentMeetingBuffer", () => {
  it("returns empty entries while loading, then hydrates from chrome.storage.session for the active tab", async () => {
    installChromeMock({
      activeTabId: 42,
      stored: {
        "captions:42": [
          { speaker: "Alice", text: "Hello.", timestamp: null },
          { speaker: "Bob", text: "Hi.", timestamp: null },
        ],
      },
    });

    const { result } = renderHook(() => useCurrentMeetingBuffer());

    expect(result.current.entries).toEqual([]);
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toHaveLength(2);
    expect(result.current.entries[0]?.text).toBe("Hello.");
  });

  it("returns empty entries when there is no buffer for this tab", async () => {
    installChromeMock({ activeTabId: 99, stored: {} });
    const { result } = renderHook(() => useCurrentMeetingBuffer());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toEqual([]);
  });

  it("returns empty entries when tabs.query returns no active tab", async () => {
    installChromeMock({});
    const { result } = renderHook(() => useCurrentMeetingBuffer());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toEqual([]);
  });

  it("does not crash when chrome.* APIs are unavailable (e.g. test bench)", async () => {
    delete (globalThis as { chrome?: unknown }).chrome;
    const { result } = renderHook(() => useCurrentMeetingBuffer());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toEqual([]);
  });

  it("scopes by tab id: another tab's buffer is not surfaced", async () => {
    installChromeMock({
      activeTabId: 1,
      stored: {
        "captions:2": [{ speaker: "X", text: "wrong tab", timestamp: null }],
      },
    });
    const { result } = renderHook(() => useCurrentMeetingBuffer());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toEqual([]);
  });
});
