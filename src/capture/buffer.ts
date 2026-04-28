import type { TranscriptEntry } from "../parsers/types.js";

export type CaptionEntry = TranscriptEntry;

export interface CaptionBuffer {
  append(entry: CaptionEntry): void;
  getAll(): CaptionEntry[];
  clear(): void;
}

export class InMemoryCaptionBuffer implements CaptionBuffer {
  private entries: CaptionEntry[] = [];

  append(entry: CaptionEntry): void {
    this.entries.push({ ...entry });
  }

  getAll(): CaptionEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }
}
