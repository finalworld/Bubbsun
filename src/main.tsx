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
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (!isAndroid) {
    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = "/manifest.webmanifest?v=6";
    document.head.appendChild(manifest);
  }
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      if (isAndroid) {
        void navigator.serviceWorker.getRegistrations().then((registrations) =>
          Promise.all(registrations.map((registration) => registration.unregister())),
        );
      } else {
        void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then((registration) => registration.update());
      }
    });
  }
  createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
}
