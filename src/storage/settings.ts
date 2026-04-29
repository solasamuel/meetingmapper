export type ExportFormat = "notion" | "confluence" | "slack" | "email";

export type Settings = {
  apiKey: string;
  defaultExportFormat: ExportFormat;
};

export const DEFAULT_SETTINGS: Settings = {
  apiKey: "",
  defaultExportFormat: "notion",
};

const SETTINGS_KEY = "settings";

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  const stored = result[SETTINGS_KEY] as Partial<Settings> | undefined;
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function setSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}
