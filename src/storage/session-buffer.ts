import type { CaptionBuffer, CaptionEntry } from "../capture/buffer.js";

const KEY_PREFIX = "captions:";

function reportStorageError(err: unknown): void {
  console.error("[meetingmapper] chrome.storage.session error:", err);
}

export class ChromeSessionCaptionBuffer implements CaptionBuffer {
  private mirror: CaptionEntry[] = [];
  private readonly key: string;

  constructor(tabId: number) {
    this.key = `${KEY_PREFIX}${tabId}`;
  }

  append(entry: CaptionEntry): void {
    this.mirror.push({ ...entry });
    this.persist().catch(reportStorageError);
  }

  getAll(): CaptionEntry[] {
    return [...this.mirror];
  }

  clear(): void {
    this.mirror = [];
    chrome.storage.session.remove(this.key).catch(reportStorageError);
  }

  async flush(): Promise<void> {
    await this.persist();
  }

  async hydrate(): Promise<void> {
    const result = await chrome.storage.session.get(this.key);
    const stored = result[this.key];
    if (Array.isArray(stored)) {
      this.mirror = stored;
    }
  }

  private async persist(): Promise<void> {
    await chrome.storage.session.set({ [this.key]: [...this.mirror] });
  }
}
