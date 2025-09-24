import express from 'express';
import geminiService from '../services/geminiService.js';

const router = express.Router();

// Check if chatbot is available
router.get('/status', (req, res) => {
    try {
        const isAvailable = geminiService.isAvailable();
        res.json({
            success: true,
            available: isAvailable,
            message: isAvailable ? 'Chatbot is available' : 'Chatbot is not available - API key not configured'
        });
    } catch (error) {
        console.error('Error checking chatbot status:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking chatbot status'
        });
    }
});

// Send message to chatbot
router.post('/message', async (req, res) => {
    try {
        const { message, context, chatHistory } = req.body;

        if (!message || !context) {
            return res.status(400).json({
                success: false,
                message: 'Message and context are required'
            });
        }

        const result = await geminiService.sendMessage(message, context, chatHistory || []);
        
        res.json(result);
    } catch (error) {
        console.error('Error sending message to chatbot:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing chatbot message'
        });
    }
});

// Get health analysis
router.post('/analyze', async (req, res) => {
    try {
        const { context } = req.body;

        if (!context) {
            return res.status(400).json({
                success: false,
                message: 'Context is required for health analysis'
            });
        }

        const result = await geminiService.analyzeHealthData(context);
        
        res.json(result);
    } catch (error) {
        console.error('Error getting health analysis:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing health analysis'
        });
    }
});

export default router;
