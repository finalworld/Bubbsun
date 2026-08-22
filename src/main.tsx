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
    manifest.href = "/manifest.webmanifest?v=809";
    document.head.appendChild(manifest);
  }
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
        const rootScope = `${window.location.origin}/`;
        const rootRegistrations = registrations.filter(
          (registration) => registration.scope === rootScope,
        );
        if (!rootRegistrations.length) return;
        await Promise.all(rootRegistrations.map((registration) => registration.unregister()));
        if (navigator.serviceWorker.controller && !sessionStorage.getItem("bubbsun-root-sw-cleared")) {
          sessionStorage.setItem("bubbsun-root-sw-cleared", "1");
          window.location.reload();
        }
      });
    });
  }
  createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
}
