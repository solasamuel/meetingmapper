import { useEffect, useState } from "react";
import type { CaptionEntry } from "../capture/buffer.js";
import { ChromeSessionCaptionBuffer } from "../storage/session-buffer.js";

export type UseCurrentMeetingBuffer = {
  entries: CaptionEntry[];
  loading: boolean;
};

export function useCurrentMeetingBuffer(): UseCurrentMeetingBuffer {
  const [entries, setEntries] = useState<CaptionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const chromeApi = (globalThis as unknown as { chrome?: typeof chrome }).chrome;
      if (!chromeApi?.tabs?.query || !chromeApi.storage?.session) {
        setLoading(false);
        return;
      }

      const tabs = await chromeApi.tabs.query({ active: true, currentWindow: true });
      const tabId = tabs[0]?.id;
      if (typeof tabId !== "number") {
        setLoading(false);
        return;
      }

      const buffer = new ChromeSessionCaptionBuffer(tabId);
      await buffer.hydrate();
      if (!cancelled) {
        setEntries(buffer.getAll());
        setLoading(false);
      }
    };

    load().catch((err) => {
      console.error("[meetingmapper] failed to load meeting buffer:", err);
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { entries, loading };
}
