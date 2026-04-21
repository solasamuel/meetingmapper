export type TranscriptEntry = {
  speaker: string | null;
  text: string;
  timestamp: string | null;
};

export type Transcript = TranscriptEntry[];

export interface TranscriptParser {
  parse(input: string): Transcript;
}

export class ParseError extends Error {
  constructor(
    message: string,
    public readonly line?: number,
  ) {
    super(message);
    this.name = "ParseError";
  }
}
