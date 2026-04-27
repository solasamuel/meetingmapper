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
import { extractStructured, ExtractionError } from "./claude.js";
import type { Transcript } from "../parsers/types.js";

const validResult = {
  action_items: [
    { task: "Send follow-up", owner: "Alice", due: null, priority: "high" as const },
  ],
  decisions: [{ decision: "Ship v1 Friday", made_by: "Bob" }],
  open_questions: ["Who owns the migration?"],
  summary: "Brief alignment on shipping.",
  attendees: [{ name: "Alice", topics: ["release"], word_count: 200 }],
};

const toolUseResponse = (input: unknown) => ({
  content: [
    {
      type: "tool_use" as const,
      id: "tool_1",
      name: "record_extraction",
      input,
    },
  ],
  stop_reason: "tool_use" as const,
});

const sampleTranscript: Transcript = [
  { speaker: "Alice", text: "Let's ship Friday.", timestamp: "00:00:01" },
  { speaker: "Bob", text: "Agreed.", timestamp: "00:00:05" },
];

beforeEach(() => {
  createMock.mockReset();
  vi.mocked(Anthropic).mockClear();
});

describe("extractStructured — AC1 SDK call shape", () => {
  it("instantiates the Anthropic client with the supplied apiKey", async () => {
    createMock.mockResolvedValue(toolUseResponse(validResult));
    await extractStructured(sampleTranscript, { apiKey: "test-key-123" });
    expect(Anthropic).toHaveBeenCalledWith({ apiKey: "test-key-123" });
  });

  it("calls messages.create with the configured model (defaults to sonnet 4.6)", async () => {
    createMock.mockResolvedValue(toolUseResponse(validResult));
    await extractStructured(sampleTranscript, { apiKey: "k" });
    const call = createMock.mock.calls[0]?.[0];
    expect(call?.model).toBe("claude-sonnet-4-6");
  });

  it("forces tool use to guarantee structured JSON output", async () => {
    createMock.mockResolvedValue(toolUseResponse(validResult));
    await extractStructured(sampleTranscript, { apiKey: "k" });
    const call = createMock.mock.calls[0]?.[0];
    expect(call?.tool_choice).toEqual({ type: "tool", name: "record_extraction" });
    expect(call?.tools).toBeDefined();
    expect(call?.tools[0].name).toBe("record_extraction");
    expect(call?.tools[0].input_schema.type).toBe("object");
    expect(call?.tools[0].input_schema.properties).toHaveProperty("action_items");
    expect(call?.tools[0].input_schema.properties).toHaveProperty("decisions");
    expect(call?.tools[0].input_schema.properties).toHaveProperty("open_questions");
    expect(call?.tools[0].input_schema.properties).toHaveProperty("summary");
    expect(call?.tools[0].input_schema.properties).toHaveProperty("attendees");
  });

  it("includes the transcript in the user message", async () => {
    createMock.mockResolvedValue(toolUseResponse(validResult));
    await extractStructured(sampleTranscript, { apiKey: "k" });
    const call = createMock.mock.calls[0]?.[0];
    const userMsg = call?.messages.find((m: { role: string }) => m.role === "user");
    expect(userMsg).toBeDefined();
    const content = typeof userMsg.content === "string"
      ? userMsg.content
      : userMsg.content.map((c: { text: string }) => c.text).join("");
    expect(content).toContain("Alice");
    expect(content).toContain("Let's ship Friday.");
    expect(content).toContain("Bob");
  });

  it("returns the parsed ExtractionResult on success", async () => {
    createMock.mockResolvedValue(toolUseResponse(validResult));
    const result = await extractStructured(sampleTranscript, { apiKey: "k" });
    expect(result).toEqual(validResult);
  });
});

describe("extractStructured — AC3 malformed response surfaces ExtractionError", () => {
  it("throws ExtractionError when response has no tool_use block", async () => {
    createMock.mockResolvedValue({
      content: [{ type: "text", text: "Sorry, I can't help with that." }],
      stop_reason: "end_turn",
    });
    await expect(extractStructured(sampleTranscript, { apiKey: "k" })).rejects.toBeInstanceOf(
      ExtractionError,
    );
  });

  it("throws ExtractionError (not ZodError) when tool_use input fails schema validation", async () => {
    const badInput = { ...validResult, summary: 42 };
    createMock.mockResolvedValue(toolUseResponse(badInput));
    await expect(extractStructured(sampleTranscript, { apiKey: "k" })).rejects.toBeInstanceOf(
      ExtractionError,
    );
  });

  it("ExtractionError message mentions the schema problem on validation failure", async () => {
    const badInput = { ...validResult, action_items: "not an array" };
    createMock.mockResolvedValue(toolUseResponse(badInput));
    await expect(extractStructured(sampleTranscript, { apiKey: "k" })).rejects.toThrow(
      /schema|invalid|validation/i,
    );
  });

  it("wraps SDK errors (e.g. network) as ExtractionError", async () => {
    createMock.mockRejectedValue(new Error("network timeout"));
    await expect(extractStructured(sampleTranscript, { apiKey: "k" })).rejects.toBeInstanceOf(
      ExtractionError,
    );
  });
});

describe("extractStructured — AC4 apiKey is required", () => {
  it("throws ExtractionError when apiKey is empty string", async () => {
    await expect(
      extractStructured(sampleTranscript, { apiKey: "" }),
    ).rejects.toBeInstanceOf(ExtractionError);
  });

  it("throws ExtractionError when apiKey is whitespace-only", async () => {
    await expect(
      extractStructured(sampleTranscript, { apiKey: "   " }),
    ).rejects.toBeInstanceOf(ExtractionError);
  });

  it("does not call the Anthropic SDK when apiKey is missing", async () => {
    await expect(
      extractStructured(sampleTranscript, { apiKey: "" }),
    ).rejects.toBeInstanceOf(ExtractionError);
    expect(Anthropic).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("error message mentions the missing key", async () => {
    await expect(
      extractStructured(sampleTranscript, { apiKey: "" }),
    ).rejects.toThrow(/api.?key/i);
  });
});
