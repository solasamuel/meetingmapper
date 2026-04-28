import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import webExtension from "vite-plugin-web-extension";
import manifest from "./src/manifest.js";

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: () => manifest,
      disableAutoLaunch: true,
      watchFilePaths: ["src/manifest.ts"],
    }),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
