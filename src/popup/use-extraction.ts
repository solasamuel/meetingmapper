import { useCallback, useState } from "react";
import type { ExtractionResult } from "../extraction/schema.js";

export type ExtractionState = "idle" | "running" | "done" | "error";

export type ExtractFn = (input: string) => Promise<ExtractionResult>;

export type UseExtraction = {
  state: ExtractionState;
  result: ExtractionResult | null;
  error: Error | null;
  run: (input: string) => void;
  reset: () => void;
};

export function useExtraction(extractFn: ExtractFn): UseExtraction {
  const [state, setState] = useState<ExtractionState>("idle");
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(
    (input: string) => {
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
