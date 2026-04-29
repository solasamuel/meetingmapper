import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Options } from "./Options.js";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("options root element missing from index.html");

createRoot(rootEl).render(
  <StrictMode>
    <Options />
  </StrictMode>,
);
