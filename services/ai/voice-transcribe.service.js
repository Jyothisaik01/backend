const { getApiKey } = require('../../config/gemini.config');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Universal Voice Transcription Service
 * Transcribes voice recordings from mobile app into clean text.
 * Primary: Groq Whisper Large V3 (fastest, accurate speech-to-text)
 * Fallback: Google Gemini Audio Intelligence
 */

async function transcribeAudio({ base64Audio, mimeType = 'audio/m4a' }) {
  if (!base64Audio) {
    throw new Error('No audio data provided');
  }

  // Clean base64 string
  let rawBase64 = base64Audio;
  let resolvedMime = mimeType;
  if (base64Audio.startsWith('data:')) {
    const match = base64Audio.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      resolvedMime = match[1];
      rawBase64 = match[2];
    }
  }

  const audioBuffer = Buffer.from(rawBase64, 'base64');
  if (audioBuffer.length < 100) {
    throw new Error('Audio recording was too short or empty');
  }

  // 1. Try Groq Whisper Large V3 first
  const groqApiKey = process.env.GROQ_API_KEY;
  if (groqApiKey) {
    try {
      const ext = resolvedMime.includes('webm')
        ? 'webm'
        : resolvedMime.includes('wav')
        ? 'wav'
        : resolvedMime.includes('mp4') || resolvedMime.includes('m4a')
        ? 'm4a'
        : resolvedMime.includes('ogg')
        ? 'ogg'
        : 'mp3';

      const blob = new Blob([audioBuffer], { type: resolvedMime });
      const formData = new FormData();
      formData.append('file', blob, `voice_query.${ext}`);
      formData.append('model', 'whisper-large-v3');
      formData.append('response_format', 'json');

      const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: formData,
      });

      if (groqRes.ok) {
        const groqData = await groqRes.json();
        const transcript = (groqData.text || '').trim();
        if (transcript) {
          return {
            success: true,
            transcript,
            provider: 'groq_whisper',
          };
        }
      } else {
        const errText = await groqRes.text().catch(() => '');
        console.warn('[Voice Transcribe] Groq Whisper error:', groqRes.status, errText);
      }
    } catch (err) {
      console.warn('[Voice Transcribe] Groq Whisper failed, trying Gemini:', err.message);
    }
  }

  // 2. Fallback to Google Gemini Audio Intelligence
  const geminiKey = getApiKey();
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      let geminiMime = 'audio/webm';
      if (resolvedMime.includes('mp4') || resolvedMime.includes('m4a')) {
        geminiMime = 'audio/mp4';
      } else if (resolvedMime.includes('wav')) {
        geminiMime = 'audio/wav';
      } else if (resolvedMime.includes('mp3')) {
        geminiMime = 'audio/mp3';
      } else if (resolvedMime.includes('ogg')) {
        geminiMime = 'audio/ogg';
      }

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: geminiMime,
            data: rawBase64,
          },
        },
        {
          text: 'You are an accurate voice speech-to-text system for an e-commerce shopping app. Transcribe the audio recording exactly as spoken. Return ONLY the transcribed text without quotes, markdown, or commentary.',
        },
      ]);

      const geminiText = result.response.text().trim();
      if (geminiText) {
        return {
          success: true,
          transcript: geminiText,
          provider: 'gemini_audio',
        };
      }
    } catch (err) {
      console.warn('[Voice Transcribe] Gemini Audio failed:', err.message);
    }
  }

  throw new Error('Could not transcribe audio. Please speak clearly and try again.');
}

module.exports = {
  transcribeAudio,
};
