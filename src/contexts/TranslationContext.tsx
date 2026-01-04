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

  // Helper function to check if text should be skipped from translation
  const shouldSkipTranslation = useCallback((text: string, node: Text): boolean => {
    const trimmed = text.trim();
    
    // Skip if parent has data-no-translate attribute
    if (node.parentElement?.hasAttribute('data-no-translate')) {
      return true;
    }
    
    // Check if we have a stored original that looks like a phone number
    // This helps restore phone numbers that were previously corrupted by translation
    const original = originalsMapRef.current.get(node);
    if (typeof original === 'string') {
      const originalDigits = original.replace(/\D/g, '');
      if (originalDigits.length >= 10 && originalDigits.length <= 15) {
        // Original was a phone number, so skip translation and restore it
        return true;
      }
    }
    
    // Skip phone numbers (10 digits, possibly with spaces/dashes/parentheses)
    // Matches patterns like: 6363717949, 636-371-7949, (636) 371-7949, etc.
    const phoneRegex = /^[\d\s\-\(\)]{10,}$/;
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly.length >= 10 && digitsOnly.length <= 15 && phoneRegex.test(trimmed)) {
      return true;
    }
    
    // Also check if text contains a phone number pattern (handles corrupted cases like "6363717949 3333")
    // Extract the first sequence of 10+ digits
    const phoneMatch = trimmed.match(/\d[\d\s\-\(\)]{9,}/);
    if (phoneMatch) {
      const matchedDigits = phoneMatch[0].replace(/\D/g, '');
      if (matchedDigits.length >= 10 && matchedDigits.length <= 15) {
        return true;
      }
    }
    
    // Skip email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(trimmed)) {
      return true;
    }
    
    // Skip URLs
    const urlRegex = /^https?:\/\/.+/i;
    if (urlRegex.test(trimmed)) {
      return true;
    }
    
    // Skip if text is only numbers (IDs, codes, etc.)
    if (/^\d+$/.test(trimmed) && trimmed.length > 3) {
      return true;
    }
    
    // Skip dates in common formats (MM/DD/YYYY, DD/MM/YYYY, etc.)
    const dateRegex = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/;
    if (dateRegex.test(trimmed)) {
      return true;
    }
    
    return false;
  }, []);

  const translatePage = useCallback(async () => {
    console.log('translatePage called with language:', language);
    // Collect text nodes from the DOM (avoid inputs and code-like blocks)
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    const nodes: Text[] = [];
    const skippedNodes: Text[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const content = node.nodeValue?.trim();
      if (!content) continue;
      if (node.parentElement && ['SCRIPT','STYLE','NOSCRIPT','CODE','PRE','INPUT','TEXTAREA'].includes(node.parentElement.tagName)) continue;
      
      // Skip text nodes inside <option> elements (especially language selector options)
      // Language selectors should always show native script names
      if (node.parentElement?.tagName === 'OPTION') {
        skippedNodes.push(node);
        continue;
      }
      
      // Check if this should be skipped (phone numbers, emails, etc.)
      if (shouldSkipTranslation(content, node)) {
        skippedNodes.push(node);
        continue;
      }
      nodes.push(node);
    }
    console.log('Found', nodes.length, 'text nodes to translate');
    // If switching back to English, restore originals for both translated and skipped nodes
    if (language === 'en') {
      nodes.forEach(node => {
        const original = originalsMapRef.current.get(node);
        if (typeof original === 'string') node.nodeValue = original;
      });
      // Also restore skipped nodes (like phone numbers) that might have been previously translated
      skippedNodes.forEach(node => {
        const original = originalsMapRef.current.get(node);
        if (typeof original === 'string') {
          node.nodeValue = original;
        }
      });
      return;
    }
    // Snapshot originals if not already stored (for both translated and skipped nodes)
    nodes.forEach(node => {
      if (!originalsMapRef.current.has(node)) {
        originalsMapRef.current.set(node, node.nodeValue || '');
      }
    });
    // For skipped nodes, restore originals if they were previously translated
    skippedNodes.forEach(node => {
      const original = originalsMapRef.current.get(node);
      if (typeof original === 'string') {
        node.nodeValue = original;
      } else {
        // Store current value as original for future reference
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
