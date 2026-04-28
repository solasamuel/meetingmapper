import packageJson from "../package.json" with { type: "json" };

export default {
  manifest_version: 3,
  name: "MeetingMapper",
  description: "Turn meeting transcripts into structured action items, decisions, and notes.",
  version: packageJson.version,

  action: {
    default_popup: "src/popup/index.html",
    default_title: "MeetingMapper",
  },

  permissions: ["storage", "activeTab"],

  host_permissions: [
    "https://meet.google.com/*",
    "https://teams.microsoft.com/*",
    "https://api.anthropic.com/*",
  ],

  background: {
    service_worker: "src/background/service-worker.ts",
    type: "module",
  },

  content_scripts: [
    {
      matches: ["https://meet.google.com/*"],
      js: ["src/content-scripts/meet.ts"],
      run_at: "document_idle",
    },
    {
      matches: ["https://teams.microsoft.com/*"],
      js: ["src/content-scripts/teams.ts"],
      run_at: "document_idle",
    },
  ],

  icons: {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png",
  },
} satisfies chrome.runtime.ManifestV3;
