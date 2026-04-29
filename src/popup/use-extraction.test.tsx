// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useExtraction } from "./use-extraction.js";
import type { ExtractionResult } from "../extraction/schema.js";

const fakeResult: ExtractionResult = {
  action_items: [],
  decisions: [],
  open_questions: [],
  summary: "All quiet.",
  attendees: [],
};

describe("useExtraction — initial state", () => {
  it("starts in idle with no result and no error", () => {
    const extractFn = vi.fn().mockResolvedValue(fakeResult);
    const { result } = renderHook(() => useExtraction(extractFn));
    expect(result.current.state).toBe("idle");
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });
});

describe("useExtraction — happy path", () => {
  it("transitions idle → running → done with the resolved result", async () => {
    const extractFn = vi.fn().mockResolvedValue(fakeResult);
    const { result } = renderHook(() => useExtraction(extractFn));

    act(() => {
      result.current.run("any input");
    });

    await waitFor(() => expect(result.current.state).toBe("done"));
    expect(result.current.result).toEqual(fakeResult);
    expect(result.current.error).toBeNull();
  });

  it("running state observable between idle and done", async () => {
    let resolveExtract: (value: ExtractionResult) => void;
    const extractFn = vi.fn(
      () =>
        new Promise<ExtractionResult>((res) => {
          resolveExtract = res;
        }),
    );

    const { result } = renderHook(() => useExtraction(extractFn));
    act(() => {
      result.current.run("input");
    });

    await waitFor(() => expect(result.current.state).toBe("running"));
    expect(result.current.result).toBeNull();

    act(() => resolveExtract!(fakeResult));
    await waitFor(() => expect(result.current.state).toBe("done"));
  });
});

describe("useExtraction — error path", () => {
  it("transitions to 'error' when extractFn rejects", async () => {
    const extractFn = vi.fn().mockRejectedValue(new Error("api blew up"));
    const { result } = renderHook(() => useExtraction(extractFn));

    act(() => {
      result.current.run("input");
    });

    await waitFor(() => expect(result.current.state).toBe("error"));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toMatch(/api blew up/);
    expect(result.current.result).toBeNull();
  });

  it("non-Error rejection is wrapped into an Error so callers always get .message", async () => {
    const extractFn = vi.fn().mockRejectedValue("just a string");
    const { result } = renderHook(() => useExtraction(extractFn));

    act(() => {
      result.current.run("input");
    });

    await waitFor(() => expect(result.current.state).toBe("error"));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain("just a string");
  });
});

describe("useExtraction — reset", () => {
  it("reset() clears result + error and returns state to idle", async () => {
    const extractFn = vi.fn().mockResolvedValue(fakeResult);
    const { result } = renderHook(() => useExtraction(extractFn));

    act(() => {
      result.current.run("x");
    });
    await waitFor(() => expect(result.current.state).toBe("done"));

    act(() => result.current.reset());
    expect(result.current.state).toBe("idle");
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
