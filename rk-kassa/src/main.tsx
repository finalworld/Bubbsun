import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Home from "../app/page";
import "../app/globals.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`);
  });
}

// A few legacy image references are stored as root-relative paths. RK Kassa
// is published below /RK/, so normalise those paths whenever React adds them.
const normaliseAppAssetPaths = (root: ParentNode) => {
  const images = [
    ...(root instanceof HTMLImageElement ? [root] : []),
    ...root.querySelectorAll<HTMLImageElement>("img[src^='/']"),
  ];
  images.forEach((image) => {
    const source = image.getAttribute("src");
    if (source && !source.startsWith(import.meta.env.BASE_URL)) {
      image.setAttribute("src", `${import.meta.env.BASE_URL}${source.slice(1)}`);
    }
  });
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Home />
  </StrictMode>,
);

normaliseAppAssetPaths(document);
new MutationObserver((changes) => {
  changes.forEach((change) => {
    change.addedNodes.forEach((node) => {
      if (node instanceof Element) normaliseAppAssetPaths(node);
    });
  });
}).observe(document.body, { childList: true, subtree: true });
