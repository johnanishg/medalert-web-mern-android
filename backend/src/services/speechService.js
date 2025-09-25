import { SpeechClient } from '@google-cloud/speech';

let speechClient;

export function getSpeechClient() {
    if (!speechClient) {
        // Use dedicated Speech credentials if provided, otherwise fall back to default env
        const speechProjectId = process.env.SPEECH_GCLOUD_PROJECT_ID || process.env.GCLOUD_PROJECT_ID;
        const speechKeyFile = process.env.SPEECH_GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS;

        const clientOptions = {};
        if (speechProjectId) clientOptions.projectId = speechProjectId;
        if (speechKeyFile) clientOptions.keyFilename = speechKeyFile;

        speechClient = new SpeechClient(clientOptions);
    }
    return speechClient;
}

export async function transcribeAudio(buffer, { languageCode = 'en-US', sampleRateHertz, encoding = 'WEBM_OPUS' } = {}) {
	const client = getSpeechClient();
	const audio = { content: buffer.toString('base64') };
	const config = {
		encoding,
		languageCode,
		// Prefer explicit mono channel for LINEAR16 from Android WAV
		audioChannelCount: 1,
		enableAutomaticPunctuation: true,
		// sampleRateHertz optional; if not provided Google will attempt to infer
		...(sampleRateHertz ? { sampleRateHertz } : {}),
	};

	console.log('Speech-to-Text request:', { languageCode, encoding, sampleRateHertz, bytes: buffer.length });
	
	const [response] = await client.recognize({ audio, config });
	if (!response || !response.results || response.results.length === 0) {
		console.warn('Speech-to-Text empty response:', JSON.stringify(response || {}, null, 2));
	}
	
	const transcription = (response.results || [])
		.map(r => (r.alternatives && r.alternatives[0] && r.alternatives[0].transcript) || '')
		.filter(Boolean)
		.join(' ');
	return transcription;
}


