import { useCallback, useState } from "react";
import type { ExtractionResult } from "../extraction/schema.js";

export type ExtractionState = "idle" | "running" | "done" | "error";

export type ExtractFn<TInput = string> = (input: TInput) => Promise<ExtractionResult>;

export type UseExtraction<TInput = string> = {
  state: ExtractionState;
  result: ExtractionResult | null;
  error: Error | null;
  run: (input: TInput) => void;
  reset: () => void;
};

export function useExtraction<TInput = string>(
  extractFn: ExtractFn<TInput>,
): UseExtraction<TInput> {
  const [state, setState] = useState<ExtractionState>("idle");
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(
    (input: TInput) => {
      setState("running");
      setResult(null);
      setError(null);
      extractFn(input)
        .then((extracted) => {
          setResult(extracted);
          setState("done");
        })
        .catch((err: unknown) => {
          const wrapped = err instanceof Error ? err : new Error(String(err));
          setError(wrapped);
          setState("error");
        });
    },
    [extractFn],
  );

  const reset = useCallback(() => {
    setState("idle");
    setResult(null);
    setError(null);
  }, []);

  return { state, result, error, run, reset };
}
