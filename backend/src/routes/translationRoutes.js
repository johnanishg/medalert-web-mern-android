import express from 'express';
import { translateText, translateTexts } from '../services/translationService.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Simple role-open endpoint; you may choose to protect or not. Keeping token optional.
router.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ message: 'text and targetLanguage are required' });
    }

    // Map UI codes to Google codes if needed
    const languageMap = { en: 'en', hi: 'hi', kn: 'kn' };
    const target = languageMap[targetLanguage] || targetLanguage;
    const source = sourceLanguage ? (languageMap[sourceLanguage] || sourceLanguage) : undefined;

    const translated = await translateText({ text, targetLanguage: target, sourceLanguage: source });
    res.json({ translatedText: translated, targetLanguage: target });
  } catch (err) {
    console.error('Translation error:', err);
    res.status(500).json({ message: 'Translation failed' });
  }
});

router.post('/batch', async (req, res) => {
  try {
    console.log('Batch translation request received:', req.body);
    const { texts, targetLanguage, sourceLanguage } = req.body;
    if (!Array.isArray(texts) || texts.length === 0 || !targetLanguage) {
      console.log('Invalid request parameters');
      return res.status(400).json({ message: 'texts (array) and targetLanguage are required' });
    }

    const languageMap = { en: 'en', hi: 'hi', kn: 'kn' };
    const target = languageMap[targetLanguage] || targetLanguage;
    const source = sourceLanguage ? (languageMap[sourceLanguage] || sourceLanguage) : undefined;

    console.log('Calling translateTexts with:', { texts, targetLanguage: target, sourceLanguage: source });
    const translated = await translateTexts({ texts, targetLanguage: target, sourceLanguage: source });
    console.log('Translation result:', translated);
    res.json({ translatedTexts: translated, targetLanguage: target });
  } catch (err) {
    console.error('Batch translation error:', err);
    res.status(500).json({ message: 'Batch translation failed' });
  }
});

export default router;
