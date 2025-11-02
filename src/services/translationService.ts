export type SupportedLanguage = 'en' | 'hi' | 'kn';

export async function translate(text: string, targetLanguage: SupportedLanguage, sourceLanguage?: SupportedLanguage): Promise<string> {
  const baseUrlRaw = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const baseUrl = (baseUrlRaw as string).replace(/\/+$/, '');
  const url = `${baseUrl}/translate/translate`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, targetLanguage, sourceLanguage }),
  });
  if (!response.ok) {
    const msg = await response.text();
    throw new Error(`Translate failed: ${response.status} ${msg}`);
  }
  const data = await response.json();
  return data.translatedText ?? text;
}

export async function translateBatch(texts: string[], targetLanguage: SupportedLanguage, sourceLanguage?: SupportedLanguage): Promise<string[]> {
  if (texts.length === 0) return [];
  const baseUrlRaw = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const baseUrl = (baseUrlRaw as string).replace(/\/+$/, '');
  const url = `${baseUrl}/translate/batch`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ texts, targetLanguage, sourceLanguage }),
  });
  if (!response.ok) {
    const msg = await response.text();
    throw new Error(`Translate batch failed: ${response.status} ${msg}`);
  }
  const data = await response.json();
  return data.translatedTexts ?? texts;
}
