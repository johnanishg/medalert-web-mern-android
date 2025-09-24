import React, { createContext, useContext, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { translate as translateApi, translateBatch, SupportedLanguage } from '../services/translationService';

interface TranslationContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  translateText: (text: string, opts?: { sourceLanguage?: SupportedLanguage }) => Promise<string>;
  translatePage?: () => Promise<void>;
}

const TranslationContext = createContext<TranslationContextValue | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const originalsMapRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const cacheRef = useRef<Map<string, Map<SupportedLanguage, string>>>(new Map());
  const observerRef = useRef<MutationObserver | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  const translateText = useCallback(
    async (text: string, opts?: { sourceLanguage?: SupportedLanguage }) => {
      if (!text) return '';
      if (language === 'en') return text; // short-circuit for default
      console.log('Translating text:', text, 'to language:', language);
      try {
        const result = await translateApi(text, language, opts?.sourceLanguage);
        console.log('Translation result:', result);
        return result;
      } catch (error) {
        console.error('Translation error:', error);
        return text;
      }
    },
    [language]
  );

  const translatePage = useCallback(async () => {
    console.log('translatePage called with language:', language);
    // Collect text nodes from the DOM (avoid inputs and code-like blocks)
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    const nodes: Text[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const content = node.nodeValue?.trim();
      if (!content) continue;
      if (node.parentElement && ['SCRIPT','STYLE','NOSCRIPT','CODE','PRE','INPUT','TEXTAREA'].includes(node.parentElement.tagName)) continue;
      nodes.push(node);
    }
    console.log('Found', nodes.length, 'text nodes to translate');
    // If switching back to English, restore originals
    if (language === 'en') {
      nodes.forEach(node => {
        const original = originalsMapRef.current.get(node);
        if (typeof original === 'string') node.nodeValue = original;
      });
      return;
    }
    // Snapshot originals if not already stored
    nodes.forEach(node => {
      if (!originalsMapRef.current.has(node)) {
        originalsMapRef.current.set(node, node.nodeValue || '');
      }
    });
    // Prepare cache-aware batch
    const texts: string[] = [];
    const nodeIndexes: number[] = [];
    nodes.forEach((node, idx) => {
      const text = (node.nodeValue || '').trim();
      const langMap = cacheRef.current.get(text);
      if (langMap && langMap.get(language)) {
        // apply cached translation immediately
        node.nodeValue = langMap.get(language) || text;
      } else {
        texts.push(text);
        nodeIndexes.push(idx);
      }
    });
    if (texts.length === 0) return;
    console.log('Translating', texts.length, 'texts in batches');
    // Limit batch size
    const BATCH = 100;
    for (let i = 0; i < texts.length; i += BATCH) {
      const slice = texts.slice(i, i + BATCH);
      console.log('Translating batch:', slice);
      try {
        const translated = await translateBatch(slice, language);
        console.log('Batch translation result:', translated);
        translated.forEach((t, j) => {
          const overallIndex = nodeIndexes[i + j];
          const node = nodes[overallIndex];
          const src = slice[j];
          // cache
          let langMap = cacheRef.current.get(src);
          if (!langMap) {
            langMap = new Map();
            cacheRef.current.set(src, langMap);
          }
          langMap.set(language, t);
          if (node) node.nodeValue = t;
        });
      } catch (e) {
        console.error('Batch translation error:', e);
        // ignore batch failures
      }
    }
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, translateText, translatePage }), [language, translateText, translatePage]);

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export function useTranslation() {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error('useTranslation must be used within TranslationProvider');
  return ctx;
}

// Setup a DOM observer and auto-translate when language changes
export function useAutoPageTranslation() {
  const { language, translatePage } = useTranslation();
  const observerRef = useRef<MutationObserver | null>(null);
  const debounceRef = useRef<number | null>(null);
  const runningRef = useRef<boolean>(false);

  useEffect(() => {
    console.log('useAutoPageTranslation: language changed to', language);
    if (!translatePage) return;
    const schedule = () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(async () => {
        if (runningRef.current) return;
        runningRef.current = true;
        try {
          console.log('Running translatePage...');
          await translatePage();
        } finally {
          runningRef.current = false;
        }
      }, 200);
    };

    // Initial run on language change
    schedule();
    // Observe DOM changes and re-run (debounced)
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new MutationObserver(() => {
      schedule();
    });
    observerRef.current.observe(document.body, { childList: true, subtree: true, characterData: false });
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [language, translatePage]);
}
