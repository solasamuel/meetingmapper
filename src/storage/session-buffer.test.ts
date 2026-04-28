// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChromeSessionCaptionBuffer } from "./session-buffer.js";

type StorageArea = {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
};

function installChromeMock(): { session: StorageArea } {
  const session: StorageArea = {
    get: vi.fn().mockResolvedValue({}),
    set: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  };
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: { session },
  };
  return { session };
}

beforeEach(() => {
  delete (globalThis as { chrome?: unknown }).chrome;
});

describe("ChromeSessionCaptionBuffer", () => {
  it("appends entries to its in-memory mirror immediately (sync getAll)", () => {
    installChromeMock();
    const buf = new ChromeSessionCaptionBuffer(42);
    buf.append({ speaker: "Alice", text: "hi", timestamp: null });
    expect(buf.getAll()).toEqual([
      { speaker: "Alice", text: "hi", timestamp: null },
    ]);
  });

  it("writes the full buffer to chrome.storage.session under a tab-id key", async () => {
    const { session } = installChromeMock();
    const buf = new ChromeSessionCaptionBuffer(42);

    buf.append({ speaker: "Alice", text: "hi", timestamp: null });
    await buf.flush();

    expect(session.set).toHaveBeenCalledWith({
      "captions:42": [{ speaker: "Alice", text: "hi", timestamp: null }],
    });
  });

  it("clear() empties both the mirror and the storage key", async () => {
    const { session } = installChromeMock();
    const buf = new ChromeSessionCaptionBuffer(42);

    buf.append({ speaker: null, text: "x", timestamp: null });
    expect(buf.getAll()).toHaveLength(1);

    await buf.clear();

    expect(buf.getAll()).toEqual([]);
    expect(session.remove).toHaveBeenCalledWith("captions:42");
  });

  it("hydrate() loads the stored buffer for the tab into the mirror", async () => {
    const { session } = installChromeMock();
    session.get.mockResolvedValueOnce({
      "captions:42": [
        { speaker: "Alice", text: "First", timestamp: null },
        { speaker: "Bob", text: "Second", timestamp: null },
      ],
    });

    const buf = new ChromeSessionCaptionBuffer(42);
    await buf.hydrate();

    expect(buf.getAll()).toEqual([
      { speaker: "Alice", text: "First", timestamp: null },
      { speaker: "Bob", text: "Second", timestamp: null },
    ]);
  });

  it("hydrate() leaves the mirror empty when storage has no entry for this tab", async () => {
    installChromeMock();
    const buf = new ChromeSessionCaptionBuffer(42);
    await buf.hydrate();
    expect(buf.getAll()).toEqual([]);
  });

  it("scopes by tab id: tab 1 and tab 2 read distinct keys", async () => {
    const { session } = installChromeMock();
    const buf1 = new ChromeSessionCaptionBuffer(1);
    const buf2 = new ChromeSessionCaptionBuffer(2);

    buf1.append({ speaker: null, text: "tab one", timestamp: null });
    buf2.append({ speaker: null, text: "tab two", timestamp: null });

    await buf1.flush();
    await buf2.flush();

    const calls = session.set.mock.calls;
    expect(calls.some((c) => "captions:1" in c[0])).toBe(true);
    expect(calls.some((c) => "captions:2" in c[0])).toBe(true);
  });

  it("getAll() returns a defensive copy", () => {
    installChromeMock();
    const buf = new ChromeSessionCaptionBuffer(42);
    buf.append({ speaker: null, text: "x", timestamp: null });
    const copy = buf.getAll();
    copy.push({ speaker: "evil", text: "mutation", timestamp: null });
    expect(buf.getAll()).toHaveLength(1);
  });
});
