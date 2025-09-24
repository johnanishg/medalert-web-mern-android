import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testGeminiAPI() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
        console.log('❌ GEMINI_API_KEY not found in environment variables');
        console.log('Please set GEMINI_API_KEY in your .env file');
        return;
    }
    
    try {
        console.log('🔑 Testing Gemini API with key:', apiKey.substring(0, 10) + '...');
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const result = await model.generateContent("Hello, can you help me with healthcare questions?");
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ Gemini API is working!');
        console.log('📝 Response:', text);
        
    } catch (error) {
        console.error('❌ Error testing Gemini API:', error.message);
        console.log('Please check your API key and try again');
    }
}

testGeminiAPI();
