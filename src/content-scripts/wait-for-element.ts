export type WaitForElementOptions = {
  doc?: Document;
  intervalMs?: number;
  timeoutMs?: number;
};

export function waitForElement(
  finder: (doc: Document) => Element | null,
  opts: WaitForElementOptions = {},
): Promise<Element> {
  const doc = opts.doc ?? document;
  const interval = opts.intervalMs ?? 500;
  const timeout = opts.timeoutMs ?? 60_000;
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const tick = () => {
      const found = finder(doc);
      if (found) {
        resolve(found);
        return;
      }
      if (Date.now() - start >= timeout) {
        reject(new Error("waitForElement: timed out"));
        return;
      }
      setTimeout(tick, interval);
    };
    tick();
  });
}
