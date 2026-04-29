// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

const { extractStructuredMock, getSettingsMock } = vi.hoisted(() => ({
  extractStructuredMock: vi.fn(),
  getSettingsMock: vi.fn(),
}));

vi.mock("../extraction/claude.js", () => ({
  extractStructured: extractStructuredMock,
  ExtractionError: class ExtractionError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "ExtractionError";
    }
  },
}));

vi.mock("../storage/settings.js", () => ({
  getSettings: getSettingsMock,
  DEFAULT_SETTINGS: { apiKey: "", defaultExportFormat: "notion" },
}));

import { runPasteExtraction } from "./run-paste-extraction.js";

const fakeResult = {
  action_items: [],
  decisions: [],
  open_questions: [],
  summary: "x",
  attendees: [],
};

beforeEach(() => {
  extractStructuredMock.mockReset();
  getSettingsMock.mockReset();
});

describe("runPasteExtraction — happy path", () => {
  it("loads apiKey from settings, parses text, calls extractStructured, returns result", async () => {
    getSettingsMock.mockResolvedValue({ apiKey: "k-123", defaultExportFormat: "notion" });
    extractStructuredMock.mockResolvedValue(fakeResult);

    const result = await runPasteExtraction("Alice: Hello team.\nBob: Hi.");

    expect(getSettingsMock).toHaveBeenCalled();
    expect(extractStructuredMock).toHaveBeenCalled();
    const [transcript, opts] = extractStructuredMock.mock.calls[0]!;
    expect(opts.apiKey).toBe("k-123");
    expect(transcript).toBeInstanceOf(Array);
    expect(transcript[0]).toMatchObject({ speaker: "Alice", text: "Hello team." });
    expect(result).toEqual(fakeResult);
  });
});

describe("runPasteExtraction — diarisation cleanup runs before extraction", () => {
  it("collapses adjacent same-speaker lines before sending to Claude", async () => {
    getSettingsMock.mockResolvedValue({ apiKey: "k", defaultExportFormat: "notion" });
    extractStructuredMock.mockResolvedValue(fakeResult);

    await runPasteExtraction("Alice: One.\nAlice: Two.\nAlice: Three.");

    const [transcript] = extractStructuredMock.mock.calls[0]!;
    expect(transcript).toHaveLength(1);
    expect(transcript[0].text).toBe("One. Two. Three.");
  });
});

describe("runPasteExtraction — guards", () => {
  it("throws a clear error when apiKey is missing", async () => {
    getSettingsMock.mockResolvedValue({ apiKey: "", defaultExportFormat: "notion" });

    await expect(runPasteExtraction("Alice: Hi")).rejects.toThrow(/api key/i);
    expect(extractStructuredMock).not.toHaveBeenCalled();
  });

  it("propagates parser errors (e.g. empty input)", async () => {
    getSettingsMock.mockResolvedValue({ apiKey: "k", defaultExportFormat: "notion" });

    await expect(runPasteExtraction("   ")).rejects.toThrow();
    expect(extractStructuredMock).not.toHaveBeenCalled();
  });

  it("propagates extractStructured failures", async () => {
    getSettingsMock.mockResolvedValue({ apiKey: "k", defaultExportFormat: "notion" });
    extractStructuredMock.mockRejectedValue(new Error("network down"));

    await expect(runPasteExtraction("Alice: Hi")).rejects.toThrow(/network down/);
  });
});
