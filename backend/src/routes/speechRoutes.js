import express from 'express';
import multer from 'multer';
import { transcribeAudio } from '../services/speechService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/speech/transcribe
// Accepts single file field "audio" and optional languageCode, sampleRateHertz, encoding
router.post('/transcribe', upload.single('audio'), async (req, res) => {
	try {
		if (!req.file || !req.file.buffer) {
			return res.status(400).json({ success: false, message: 'No audio file uploaded' });
		}

		const languageCode = (req.body.languageCode || 'en-US').toString();
		let sampleRateHertz = req.body.sampleRateHertz ? Number(req.body.sampleRateHertz) : undefined;
		const encoding = req.body.encoding ? String(req.body.encoding) : undefined;

		// If WAV header is present, attempt to parse sample rate for LINEAR16
		try {
			if (!sampleRateHertz && req.file.mimetype === 'audio/wav' && req.file.buffer.length >= 24) {
				// WAV: bytes 24-27 little-endian sample rate
				const sr = req.file.buffer.readUInt32LE(24);
				if (sr > 0 && sr < 192001) sampleRateHertz = sr;
			}
		} catch (e) {
			console.warn('Failed to parse WAV header for sample rate:', e.message);
		}

		const text = await transcribeAudio(req.file.buffer, { languageCode, sampleRateHertz, encoding });
		return res.json({ success: true, transcription: text });
	} catch (err) {
		console.error('Speech transcription error:', err?.response?.data || err?.message || err);
		return res.status(500).json({ success: false, message: 'Transcription failed' });
	}
});

export default router;


