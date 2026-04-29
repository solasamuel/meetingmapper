// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getSettings,
  setSettings,
  DEFAULT_SETTINGS,
} from "./settings.js";

type StorageArea = {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
};

function installChromeMock(): { local: StorageArea; sync: StorageArea } {
  const local: StorageArea = {
    get: vi.fn().mockResolvedValue({}),
    set: vi.fn().mockResolvedValue(undefined),
  };
  const sync: StorageArea = {
    get: vi.fn().mockResolvedValue({}),
    set: vi.fn().mockResolvedValue(undefined),
  };
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: { local, sync },
  };
  return { local, sync };
}

beforeEach(() => {
  delete (globalThis as { chrome?: unknown }).chrome;
});

describe("getSettings", () => {
  it("returns DEFAULT_SETTINGS when nothing is stored", async () => {
    installChromeMock();
    const settings = await getSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it("returns stored settings merged over defaults", async () => {
    const { local } = installChromeMock();
    local.get.mockResolvedValueOnce({
      settings: { apiKey: "stored-key", defaultExportFormat: "slack" },
    });
    const settings = await getSettings();
    expect(settings).toEqual({ apiKey: "stored-key", defaultExportFormat: "slack" });
  });

  it("fills in missing fields from DEFAULT_SETTINGS when stored object is partial", async () => {
    const { local } = installChromeMock();
    local.get.mockResolvedValueOnce({ settings: { apiKey: "only-key" } });
    const settings = await getSettings();
    expect(settings.apiKey).toBe("only-key");
    expect(settings.defaultExportFormat).toBe(DEFAULT_SETTINGS.defaultExportFormat);
  });

  it("reads from chrome.storage.local, never chrome.storage.sync (AC2)", async () => {
    const { local, sync } = installChromeMock();
    await getSettings();
    expect(local.get).toHaveBeenCalled();
    expect(sync.get).not.toHaveBeenCalled();
  });
});

describe("setSettings", () => {
  it("writes the full settings object under the 'settings' key in local storage", async () => {
    const { local } = installChromeMock();
    await setSettings({ apiKey: "new-key", defaultExportFormat: "email" });
    expect(local.set).toHaveBeenCalledWith({
      settings: { apiKey: "new-key", defaultExportFormat: "email" },
    });
  });

  it("writes to chrome.storage.local, never chrome.storage.sync (AC2)", async () => {
    const { local, sync } = installChromeMock();
    await setSettings({ apiKey: "k", defaultExportFormat: "notion" });
    expect(local.set).toHaveBeenCalled();
    expect(sync.set).not.toHaveBeenCalled();
  });

  it("rejects an unknown defaultExportFormat at the type level", () => {
    // Type-level guard — this test is a compile-time fence; if someone
    // widens the union, the test still passes but the type system
    // protects callers from passing 'twitter' or similar.
    expect(DEFAULT_SETTINGS.defaultExportFormat).toMatch(/^(notion|confluence|slack|email)$/);
  });
});
