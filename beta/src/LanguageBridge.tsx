"use client";
import { useEffect } from "react";
import { uiTranslations } from "./i18n";

const sourceText = new WeakMap<Node, string>();
const renderedText = new WeakMap<Node, string>();
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
  inner = inner.replace(/^kvar(\s*·)?$/i, (_, separator="") => `${dict.Kvar || "kvar"}${separator}`);
  inner = inner.replace(/^klara$/i, dict.Klara || "klara");
  inner = inner.replace(/^(\d+)\s+(minuter|minutes|minuuttia|Minuten|minutos|minutes|minuti|minut|minuten)$/i, (_, n) => `${n} ${dict.Minuter || uiTranslations.en.Minuter || "minutes"}`);
  inner = inner.replace(/^(\d+)\s+(portioner|servings|annosta|Portionen|porciones|portions|porzioni|porcji|porties)$/i, (_, n) => `${n} ${dict.Portioner || uiTranslations.en.Portioner || "servings"}`);
  inner = inner.replace(/^(Skriv till|Message|Kirjoita käyttäjälle|Nachricht an|Escribir a|Écrire à|Scrivi a|Napisz do|Schrijf naar)\s+(.+)$/i, (_, label, name) => {
    const key = canonical(label);
    return `${dict[key] || uiTranslations.en[key] || label} ${name}`;
  });
  inner = inner.replace(/^(\d+)\s+(nya meddelanden|new messages|uutta viestiä|neue Nachrichten|mensajes nuevos|nouveaux messages|nuovi messaggi|nowych wiadomości|nieuwe berichten)$/i, (_, n) => `${n} ${dict["nya meddelanden"] || uiTranslations.en["nya meddelanden"] || "new messages"}`);
  inner = inner.replace(/^(Ändrad|Skapad):\s*(.+)$/i, (_, label, rest) => {
    const key = canonical(label);
    return `${dict[key] || uiTranslations.en[key] || label}: ${rest}`;
  });
  if (language === "en") {
    inner = inner.replace(/^(\d+)\s+röst(er)?(\s*·)/i, (_, n, plural, separator) => `${n} ${plural ? "votes" : "vote"}${separator}`);
    inner = inner.replace(/^completed poster$/i, "Completed items");
    inner = inner.replace(/^(\d+)\s+poster$/i, "$1 items");
    inner = inner.replace(/^(\d+)\s+klara poster$/i, "$1 completed items");
    inner = inner.replace(/^(\d+)\s+tummar har delats ut i (.+)\.$/i, "$1 flames have been shared in $2.");
  }
  const key = canonical(inner);
  const result = dict[key] || uiTranslations.en[key] || inner;
  const locale = language === "tlh" ? "en" : language;
  const output = inner === inner.toLocaleUpperCase(locale) ? result.toLocaleUpperCase(locale) : inner === inner.toLocaleLowerCase(locale) ? result.toLocaleLowerCase(locale) : result;
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
        const lastRendered = renderedText.get(text);
        if (!sourceText.has(text) || (lastRendered !== undefined && text.data !== lastRendered)) {
          sourceText.set(text, text.data);
        }
        const original = sourceText.get(text) || text.data;
        const next = translate(original, language);
        renderedText.set(text, next);
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
          if (original) {
            const next = translate(original, language);
            if (current !== next) node.setAttribute(attr, next);
          }
        }
      }
      node.childNodes.forEach(process);
    };
    process(root);
    const observer = new MutationObserver(entries => {
      if (applying) return;
      applying = true;
      for (const entry of entries) {
        if (entry.type === "characterData") process(entry.target);
        else if (entry.type === "attributes") process(entry.target);
        else entry.addedNodes.forEach(process);
      }
      applying = false;
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "title", "aria-label"] });
    return () => observer.disconnect();
  }, [language]);
  return null;
}
