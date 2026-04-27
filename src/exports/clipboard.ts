export class ClipboardUnavailableError extends Error {
  constructor() {
    super("Clipboard API is not available in this environment.");
    this.name = "ClipboardUnavailableError";
  }
}

export async function copyToClipboard(text: string): Promise<void> {
  const clipboard = (globalThis.navigator as { clipboard?: { writeText: (text: string) => Promise<void> } } | undefined)?.clipboard;
  if (!clipboard?.writeText) {
    throw new ClipboardUnavailableError();
  }
  await clipboard.writeText(text);
}
