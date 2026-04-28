import type { CaptionBuffer } from "./buffer.js";

const MEET_HOST = "meet.google.com";

export function isMeetHost(hostname: string): boolean {
  return hostname === MEET_HOST;
}

export function findCaptionContainer(doc: Document = document): Element | null {
  const regions = doc.querySelectorAll('[role="region"]');
  for (const region of regions) {
    const label = region.getAttribute("aria-label") ?? "";
    if (/caption/i.test(label)) return region;
  }
  return doc.querySelector("[aria-live]");
}

export type MeetCaptureOptions = {
  root: Element;
  buffer: CaptionBuffer;
  now?: () => Date;
};

export type MeetCaptureObserver = {
  start(): void;
  stop(): void;
};

export function createMeetCaptureObserver(opts: MeetCaptureOptions): MeetCaptureObserver {
  const { root, buffer } = opts;
  let observer: MutationObserver | null = null;

  function extractSpeakerAndText(node: Element): { speaker: string | null; text: string } {
    const speakerEl = node.querySelector<HTMLElement>("[data-speaker]");
    if (!speakerEl) {
      return { speaker: null, text: (node.textContent ?? "").trim() };
    }

    const speaker = (speakerEl.textContent ?? "").trim() || null;
    // Build text by concatenating all descendant text nodes that aren't
    // inside the speaker element. Avoids stripping work that depends on
    // exact whitespace between sibling elements.
    const clone = node.cloneNode(true) as Element;
    clone.querySelectorAll("[data-speaker]").forEach((el) => el.remove());
    const text = (clone.textContent ?? "").trim();
    return { speaker, text };
  }

  function handleMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;
        const { speaker, text } = extractSpeakerAndText(node);
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
