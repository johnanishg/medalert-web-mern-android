import { translateText, translateTexts } from './src/services/translationService.js';

async function testTranslation() {
  try {
    console.log('Testing single translation...');
    const result1 = await translateText({ 
      text: 'Hello', 
      targetLanguage: 'hi' 
    });
    console.log('Single translation result:', result1);
    
    console.log('Testing batch translation...');
    const result2 = await translateTexts({ 
      texts: ['Hello', 'World'], 
      targetLanguage: 'hi' 
    });
    console.log('Batch translation result:', result2);
  } catch (error) {
    console.error('Translation test failed:', error);
  }
}

testTranslation();
