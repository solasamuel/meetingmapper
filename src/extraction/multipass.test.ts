import { describe, it, expect, vi, beforeEach } from "vitest";

const createMock = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: { create: createMock },
    })),
  };
});

import Anthropic from "@anthropic-ai/sdk";
import { extractStructuredMultiPass } from "./multipass.js";
import { ExtractionError } from "./claude.js";
import type { Transcript } from "../parsers/types.js";

const validResult = {
  action_items: [
    { task: "Send follow-up", owner: "Alice", due: null, priority: "high" as const },
  ],
  decisions: [{ decision: "Ship Friday", made_by: "Bob" }],
  open_questions: ["Who owns the migration?"],
  summary: "Aligned on shipping.",
  attendees: [{ name: "Alice", topics: ["release"], word_count: 200 }],
};

const validRawFacts = {
  tasks_mentioned: ["Send follow-up email to design team"],
  decisions_mentioned: ["Ship v1 on Friday"],
  questions_raised: ["Who owns the migration?"],
  speakers_seen: ["Alice", "Bob"],
};

const toolUseResponse = (name: string, input: unknown) => ({
  content: [{ type: "tool_use" as const, id: "t1", name, input }],
  stop_reason: "tool_use" as const,
});

const repeat = (word: string, n: number) => Array(n).fill(word).join(" ");

const longTranscript: Transcript = [
  { speaker: "Alice", text: repeat("alpha", 1600), timestamp: "00:00:01" },
  { speaker: "Bob", text: repeat("bravo", 1600), timestamp: "00:10:00" },
  { speaker: "Alice", text: repeat("charlie", 1600), timestamp: "00:20:00" },
];

beforeEach(() => {
  createMock.mockReset();
  vi.mocked(Anthropic).mockClear();
});

describe("extractStructuredMultiPass — AC4 exactly two API calls", () => {
  it("makes exactly two Claude calls regardless of chunk count", async () => {
    createMock
      .mockResolvedValueOnce(toolUseResponse("record_raw_facts", validRawFacts))
      .mockResolvedValueOnce(toolUseResponse("record_extraction", validResult));

    await extractStructuredMultiPass(longTranscript, { apiKey: "k" });

    expect(createMock).toHaveBeenCalledTimes(2);
  });
});

describe("extractStructuredMultiPass — AC2 pass 1 extracts raw facts", () => {
  it("first call uses the record_raw_facts tool", async () => {
    createMock
      .mockResolvedValueOnce(toolUseResponse("record_raw_facts", validRawFacts))
      .mockResolvedValueOnce(toolUseResponse("record_extraction", validResult));

    await extractStructuredMultiPass(longTranscript, { apiKey: "k" });

    const firstCall = createMock.mock.calls[0]?.[0];
    expect(firstCall?.tool_choice).toEqual({ type: "tool", name: "record_raw_facts" });
    expect(firstCall?.tools[0].name).toBe("record_raw_facts");
  });

  it("first call's user message contains all chunks delimited", async () => {
    createMock
      .mockResolvedValueOnce(toolUseResponse("record_raw_facts", validRawFacts))
      .mockResolvedValueOnce(toolUseResponse("record_extraction", validResult));

    await extractStructuredMultiPass(longTranscript, { apiKey: "k" });

    const firstCall = createMock.mock.calls[0]?.[0];
    const content = firstCall?.messages[0].content as string;
    expect(content).toContain("alpha");
    expect(content).toContain("bravo");
    expect(content).toContain("charlie");
    expect(content).toMatch(/chunk\s*\d/i);
  });
});

describe("extractStructuredMultiPass — AC3 pass 2 synthesises", () => {
  it("second call uses the record_extraction tool", async () => {
    createMock
      .mockResolvedValueOnce(toolUseResponse("record_raw_facts", validRawFacts))
      .mockResolvedValueOnce(toolUseResponse("record_extraction", validResult));

    await extractStructuredMultiPass(longTranscript, { apiKey: "k" });

    const secondCall = createMock.mock.calls[1]?.[0];
    expect(secondCall?.tool_choice).toEqual({ type: "tool", name: "record_extraction" });
  });

  it("second call's user message includes the raw facts from pass 1", async () => {
    createMock
      .mockResolvedValueOnce(toolUseResponse("record_raw_facts", validRawFacts))
      .mockResolvedValueOnce(toolUseResponse("record_extraction", validResult));

    await extractStructuredMultiPass(longTranscript, { apiKey: "k" });

    const secondCall = createMock.mock.calls[1]?.[0];
    const content = secondCall?.messages[0].content as string;
    expect(content).toContain("Send follow-up email to design team");
    expect(content).toContain("Ship v1 on Friday");
    expect(content).toContain("Who owns the migration?");
  });

  it("returns the parsed ExtractionResult from pass 2", async () => {
    createMock
      .mockResolvedValueOnce(toolUseResponse("record_raw_facts", validRawFacts))
      .mockResolvedValueOnce(toolUseResponse("record_extraction", validResult));

    const result = await extractStructuredMultiPass(longTranscript, { apiKey: "k" });
    expect(result).toEqual(validResult);
  });
});

describe("extractStructuredMultiPass — AC5 onProgress callback", () => {
  it("fires 'extracting' before pass 1 and 'synthesising' before pass 2", async () => {
    createMock
      .mockResolvedValueOnce(toolUseResponse("record_raw_facts", validRawFacts))
      .mockResolvedValueOnce(toolUseResponse("record_extraction", validResult));

    const stages: string[] = [];
    await extractStructuredMultiPass(longTranscript, {
      apiKey: "k",
      onProgress: (stage) => stages.push(stage),
    });

    expect(stages).toEqual(["extracting", "synthesising"]);
  });

  it("works without onProgress (callback is optional)", async () => {
    createMock
      .mockResolvedValueOnce(toolUseResponse("record_raw_facts", validRawFacts))
      .mockResolvedValueOnce(toolUseResponse("record_extraction", validResult));

    await expect(
      extractStructuredMultiPass(longTranscript, { apiKey: "k" }),
    ).resolves.toEqual(validResult);
  });
});

describe("extractStructuredMultiPass — error paths", () => {
  it("throws ExtractionError when pass 1 fails schema validation", async () => {
    createMock
      .mockResolvedValueOnce(toolUseResponse("record_raw_facts", { invalid: "shape" }))
      .mockResolvedValueOnce(toolUseResponse("record_extraction", validResult));

    await expect(
      extractStructuredMultiPass(longTranscript, { apiKey: "k" }),
    ).rejects.toBeInstanceOf(ExtractionError);
  });

  it("does not call pass 2 if pass 1 fails", async () => {
    createMock.mockResolvedValueOnce(toolUseResponse("record_raw_facts", { invalid: "shape" }));

    await expect(
      extractStructuredMultiPass(longTranscript, { apiKey: "k" }),
    ).rejects.toBeInstanceOf(ExtractionError);
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it("rejects empty apiKey before any SDK call", async () => {
    await expect(
      extractStructuredMultiPass(longTranscript, { apiKey: "" }),
    ).rejects.toBeInstanceOf(ExtractionError);
    expect(Anthropic).not.toHaveBeenCalled();
  });
});
