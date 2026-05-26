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

import { runFromTranscript } from "./run-from-transcript.js";
import type { Transcript } from "../parsers/types.js";

const fakeResult = {
  action_items: [],
  decisions: [],
  open_questions: [],
  summary: "ok",
  attendees: [],
};

const transcript: Transcript = [
  { speaker: "Alice", text: "Hello.", timestamp: null },
  { speaker: "Alice", text: "How are you?", timestamp: null },
  { speaker: "Bob", text: "Good.", timestamp: null },
];

beforeEach(() => {
  extractStructuredMock.mockReset();
  getSettingsMock.mockReset();
});

describe("runFromTranscript", () => {
  it("calls getSettings and extractStructured with the supplied transcript", async () => {
    getSettingsMock.mockResolvedValue({ apiKey: "k", defaultExportFormat: "notion" });
    extractStructuredMock.mockResolvedValue(fakeResult);

    const result = await runFromTranscript(transcript);

    expect(getSettingsMock).toHaveBeenCalled();
    expect(extractStructuredMock).toHaveBeenCalled();
    expect(result).toEqual(fakeResult);
  });

  it("collapses consecutive same-speaker entries before extraction", async () => {
    getSettingsMock.mockResolvedValue({ apiKey: "k", defaultExportFormat: "notion" });
    extractStructuredMock.mockResolvedValue(fakeResult);

    await runFromTranscript(transcript);

    const [cleaned] = extractStructuredMock.mock.calls[0]!;
    expect(cleaned).toHaveLength(2);
    expect(cleaned[0].text).toBe("Hello. How are you?");
  });

  it("throws when apiKey is empty", async () => {
    getSettingsMock.mockResolvedValue({ apiKey: "", defaultExportFormat: "notion" });

    await expect(runFromTranscript(transcript)).rejects.toThrow(/api key/i);
    expect(extractStructuredMock).not.toHaveBeenCalled();
  });
});
