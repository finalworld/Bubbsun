import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "../app/page";

const canonicalOrigin = "https://www.bubbsun.se";
const legacyHosts = new Set([
  "bubbsun.se",
]);

if (legacyHosts.has(window.location.hostname)) {
  window.location.replace(`${canonicalOrigin}${window.location.pathname}${window.location.search}${window.location.hash}`);
} else {
  if("serviceWorker" in navigator) window.addEventListener("load",()=>void navigator.serviceWorker.register("/beta/sw.js",{scope:"/beta/",updateViaCache:"none"}).then(registration=>registration.update()));
  createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
}
