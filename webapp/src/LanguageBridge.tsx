"use client";
import { useEffect } from "react";
import { uiTranslations } from "./i18n";

const sourceText = new WeakMap<Node, string>();
const sourceAttrs = new WeakMap<Element, Map<string, string>>();
const norm = (value: string) => value.trim().toLocaleLowerCase("sv");

function canonical(value: string) {
  const trimmed = value.trim();
  for (const dict of Object.values(uiTranslations)) {
    for (const [key, translated] of Object.entries(dict)) {
      if (norm(key) === norm(trimmed) || norm(translated) === norm(trimmed)) return key;
    }
  }
  return trimmed;
}

function translate(value: string, language: string) {
  if (!value.trim() || language === "sv") return value;
  const dict = uiTranslations[language] || uiTranslations.en;
  let inner = value.trim();
  inner = inner.replace(/(\d+)\s+(kvar|remaining|jäljellä|übrig|pendientes|restants|rimanenti|pozostało|resterend)/gi, (_, n) => `${n} ${dict.Kvar || "kvar"}`);
  inner = inner.replace(/(\d+)\s+(klara|completed|valmiit|erledigt|completados|terminés|completati|ukończone|voltooid)/gi, (_, n) => `${n} ${dict.Klara || "klara"}`);
  const key = canonical(inner);
  const result = dict[key] || inner;
  const output = inner === inner.toUpperCase() ? result.toLocaleUpperCase(language === "tlh" ? "en" : language) : result;
  return value.replace(value.trim(), output);
}

export function LanguageBridge({ language }: { language: string }) {
  useEffect(() => {
    document.documentElement.lang = language === "tlh" ? "tlh" : language;
    const root = document.querySelector(".app-shell");
    if (!root) return;
    let applying = false;
    const process = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node as Text;
        if (!sourceText.has(text)) sourceText.set(text, text.data);
        const original = sourceText.get(text) || text.data;
        const next = translate(original, language);
        if (next !== text.data) text.data = next;
        return;
      }
      if (node instanceof Element) {
        let originals = sourceAttrs.get(node);
        if (!originals) { originals = new Map(); sourceAttrs.set(node, originals); }
        for (const attr of ["placeholder", "title", "aria-label"]) {
          const current = node.getAttribute(attr);
          if (current && !originals.has(attr)) originals.set(attr, current);
          const original = originals.get(attr);
          if (original) node.setAttribute(attr, translate(original, language));
        }
      }
      node.childNodes.forEach(process);
    };
    process(root);
    const observer = new MutationObserver(entries => {
      if (applying) return;
      applying = true;
      for (const entry of entries) entry.addedNodes.forEach(process);
      applying = false;
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);
  return null;
}
