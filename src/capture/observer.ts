import type { CaptionBuffer } from "./buffer.js";

export type SpeakerExtractor = (node: Element) => { speaker: string | null; text: string };

export type CaptureObserverOptions = {
  root: Element;
  buffer: CaptionBuffer;
  extract: SpeakerExtractor;
};

export type CaptureObserver = {
  start(): void;
  stop(): void;
};

export function makeSpeakerExtractor(speakerSelector: string): SpeakerExtractor {
  return (node: Element) => {
    const speakerEl = node.querySelector<HTMLElement>(speakerSelector);
    if (!speakerEl) {
      return { speaker: null, text: (node.textContent ?? "").trim() };
    }
    const speaker = (speakerEl.textContent ?? "").trim() || null;
    const clone = node.cloneNode(true) as Element;
    clone.querySelectorAll(speakerSelector).forEach((el) => el.remove());
    const text = (clone.textContent ?? "").trim();
    return { speaker, text };
  };
}

export function createCaptureObserver(opts: CaptureObserverOptions): CaptureObserver {
  const { root, buffer, extract } = opts;
  let observer: MutationObserver | null = null;

  function handleMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;
        const { speaker, text } = extract(node);
        if (text === "") continue;
        buffer.append({ speaker, text, timestamp: null });
      }
    }
  }

  return {
    start(): void {
      if (observer) return;
      observer = new MutationObserver(handleMutations);
      observer.observe(root, { childList: true, subtree: true });
    },
    stop(): void {
      observer?.disconnect();
      observer = null;
    },
  };
}
