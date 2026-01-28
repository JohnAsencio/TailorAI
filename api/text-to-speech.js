/**
 * API endpoint for text-to-speech conversion
 * Uses Google Cloud Text-to-Speech API for high-quality, natural-sounding voices
 * Falls back to browser TTS if API key is not configured
 */

import { loadEnvFromLocal } from './utils/loadEnv.js';

// Load env vars for local dev
loadEnvFromLocal();

const GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY || '';
const USE_TTS_API = GOOGLE_TTS_API_KEY !== '';

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { text, voiceName, languageCode = 'en-US' } = body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    // If API key is not configured, return error (frontend will fallback to browser TTS)
    if (!USE_TTS_API) {
      return res.status(503).json({ 
        error: 'TTS API not configured',
        fallback: true 
      });
    }

    // Use Google Cloud Text-to-Speech API
    // Voice options: https://cloud.google.com/text-to-speech/docs/voices
    // Note: Standard voices (e.g., 'en-US-Standard-F') are free up to 4M chars/month
    //       Neural2 voices (e.g., 'en-US-Neural2-F') are free up to 1M chars/month, then $16/1M chars
    // Use Standard voices to maximize free tier usage
    const voiceConfig = voiceName || 'en-US-Standard-F'; // Free Standard voice by default (change to Neural2 for premium quality)
    
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode,
            name: voiceConfig,
            ssmlGender: 'FEMALE' // or 'NEUTRAL', 'MALE'
          },
          // Use standard audio config - can upgrade to MP3_64_KBPS for higher quality if needed
          audioConfig: {
            audioEncoding: 'MP3', // Browser-compatible format
            speakingRate: 0.95,   // Slightly slower for natural pace
            pitch: 1.0,           // Natural pitch
            volumeGainDb: 0.0,    // Normal volume
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Google TTS API error:', errorData);
      return res.status(response.status).json({
        error: 'TTS API request failed',
        details: errorData,
        fallback: true
      });
    }

    const data = await response.json();
    
    // Return base64-encoded audio
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      success: true,
      audioContent: data.audioContent, // Base64-encoded MP3
      format: 'mp3'
    });

  } catch (error) {
    console.error('TTS API error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      error: 'An error occurred generating speech',
      details: error.message,
      fallback: true
    });
  }
}

