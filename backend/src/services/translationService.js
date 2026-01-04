import { v3 as TranslateV3 } from '@google-cloud/translate';

let translateClient;

export function getTranslateClient() {
  if (!translateClient) {
    // Credentials are resolved from GOOGLE_APPLICATION_CREDENTIALS or default env
    translateClient = new TranslateV3.TranslationServiceClient();
  }
  return translateClient;
}

export async function translateText({ text, targetLanguage, sourceLanguage }) {
  const projectId = process.env.GCLOUD_PROJECT_ID;
  const location = process.env.GCLOUD_TRANSLATE_LOCATION || 'global';
  
  if (!projectId) {
    throw new Error('GCLOUD_PROJECT_ID is not set');
  }
  if (!text || !targetLanguage) {
    throw new Error('text and targetLanguage are required');
  }

  const client = getTranslateClient();
  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: [text],
    mimeType: 'text/plain',
    targetLanguageCode: targetLanguage,
    sourceLanguageCode: sourceLanguage || undefined,
  };

  const [response] = await client.translateText(request);
  const translations = response.translations || [];
  return translations.length > 0 ? translations[0].translatedText : text;
}

export async function translateTexts({ texts, targetLanguage, sourceLanguage }) {
  const projectId = process.env.GCLOUD_PROJECT_ID;
  const location = process.env.GCLOUD_TRANSLATE_LOCATION || 'global';
  
  if (!projectId) {
    throw new Error('GCLOUD_PROJECT_ID is not set');
  }
  if (!Array.isArray(texts) || texts.length === 0 || !targetLanguage) {
    throw new Error('texts (non-empty array) and targetLanguage are required');
  }

  const client = getTranslateClient();
  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: texts,
    mimeType: 'text/plain',
    targetLanguageCode: targetLanguage,
    sourceLanguageCode: sourceLanguage || undefined,
  };

  const [response] = await client.translateText(request);
  const translations = response.translations || [];
  return translations.map(t => t.translatedText);
}
