/**
 * API endpoint for text-to-speech conversion
 * Uses Google Cloud Text-to-Speech API for high-quality, natural-sounding voices
 * Falls back to browser TTS if API key is not configured
 */

import { loadEnvFromLocal } from '../lib/loadEnv.js';
import { getAuthedUserId } from '../lib/auth.js';

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
    const authedUserId = await getAuthedUserId(req);
    if (!authedUserId) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(401).json({ error: 'Unauthorized. Please sign in again.' });
    }

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
    // Note: Standard voices (e.g., 'en-US-Standard-F') are the older concatenative
    // voices and sound noticeably robotic - a bad fit for an interviewer people are
    // meant to find realistic. Neural2 voices sound far more natural for a small
    // added cost (1M chars/month free, then $16/1M chars - well within reach at
    // current interview volume). Default to Neural2; still overridable via voiceName.
    const voiceConfig = voiceName || 'en-US-Neural2-F';
    
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

