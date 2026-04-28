export type ElementFinder = (doc: Document) => Element | null;

export type WatchForElementOptions = {
  onAppear: (el: Element) => void;
  onDisappear?: () => void;
  doc?: Document;
};

export type ElementWatcher = {
  disconnect(): void;
};

export function watchForElement(
  finder: ElementFinder,
  opts: WatchForElementOptions,
): ElementWatcher {
  const doc = opts.doc ?? document;
  let current: Element | null = null;
  let disconnected = false;

  const check = () => {
    if (disconnected) return;
    const found = finder(doc);
    if (found && found !== current) {
      current = found;
      opts.onAppear(found);
    } else if (!found && current) {
      current = null;
      opts.onDisappear?.();
    }
  };

  // Initial synchronous check
  check();

  const observer = new MutationObserver(check);
  observer.observe(doc.body, { childList: true, subtree: true });

  return {
    disconnect(): void {
      disconnected = true;
      observer.disconnect();
    },
  };
}
