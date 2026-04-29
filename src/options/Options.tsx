import { useEffect, useId, useState, type FormEvent } from "react";
import {
  DEFAULT_SETTINGS,
  getSettings,
  setSettings,
  type ExportFormat,
  type Settings,
} from "../storage/settings.js";

const EXPORT_FORMATS: ReadonlyArray<{ value: ExportFormat; label: string }> = [
  { value: "notion", label: "Notion" },
  { value: "confluence", label: "Confluence" },
  { value: "slack", label: "Slack" },
  { value: "email", label: "Plain email" },
];

const SAVED_TOAST_MS = 1500;

export function Options() {
  const apiKeyId = useId();
  const formatId = useId();

  const [settings, setLocalSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings()
      .then(setLocalSettings)
      .catch((err) => {
        console.error("[meetingmapper] failed to load settings:", err);
      });
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSettings(settings)
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), SAVED_TOAST_MS);
      })
      .catch((err) => {
        console.error("[meetingmapper] failed to save settings:", err);
      });
  };

  return (
    <div className="options-page">
      <h1 className="options-title">MeetingMapper Settings</h1>

      <form onSubmit={handleSubmit} className="options-form">
        <div className="field">
          <label htmlFor={apiKeyId}>Anthropic API key</label>
          <div className="field-row">
            <input
              id={apiKeyId}
              type={showKey ? "text" : "password"}
              value={settings.apiKey}
              onChange={(e) =>
                setLocalSettings((s) => ({ ...s, apiKey: e.target.value }))
              }
              autoComplete="off"
              spellCheck={false}
              placeholder="sk-ant-..."
            />
            <button
              type="button"
              className="show-hide"
              onClick={() => setShowKey((v) => !v)}
            >
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
          <p className="field-help">
            Stored in <code>chrome.storage.local</code>, never synced across devices.
          </p>
        </div>

        <div className="field">
          <label htmlFor={formatId}>Default export format</label>
          <select
            id={formatId}
            value={settings.defaultExportFormat}
            onChange={(e) =>
              setLocalSettings((s) => ({
                ...s,
                defaultExportFormat: e.target.value as ExportFormat,
              }))
            }
          >
            {EXPORT_FORMATS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field-row">
          <button type="submit" className="save-button">
            Save
          </button>
          {saved && (
            <span className="saved-toast" role="status">
              Saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
