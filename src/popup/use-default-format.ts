import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, getSettings, type ExportFormat } from "../storage/settings.js";

export function useDefaultFormat(): ExportFormat {
  const [format, setFormat] = useState<ExportFormat>(DEFAULT_SETTINGS.defaultExportFormat);

  useEffect(() => {
    getSettings()
      .then((s) => setFormat(s.defaultExportFormat))
      .catch((err) => {
        console.error("[meetingmapper] failed to load default format:", err);
      });
  }, []);

  return format;
}
