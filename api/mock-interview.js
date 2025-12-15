/**
 * API endpoint for mock interview conversations
 * Handles conversational AI for interview practice
 */

import { loadEnvFromLocal } from './utils/loadEnv.js';
import { OpenAI } from 'openai';

// Load env vars for local dev
loadEnvFromLocal();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

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
    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'OpenAI API key is not configured on the server'
      });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { 
      messages, 
      resumeText, 
      jobDescription, 
      jobTitle,
      interviewerPersona,
      interviewStage 
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    // Build system prompt for the interviewer
    let systemPrompt = `You are a professional job interviewer conducting a mock interview. Your role is to:
1. ALWAYS start with a warm greeting like "Hi, welcome! How are you doing today?" or "Hello! Thanks for coming in today. How are you?" BEFORE asking any interview questions
2. After the greeting and their response, then ask "Tell me about yourself" to begin the interview
3. Ask relevant questions based on the job description and candidate's resume
4. Ask follow-up questions based on the candidate's answers
5. Be conversational and natural, like a real interviewer
6. At the end, ask "Do you have any questions for me?"
7. Keep responses concise (2-3 sentences max) - this is a conversation, not a monologue

IMPORTANT: If this is the first message (messages array only has your greeting), respond with ONLY a warm greeting. Do NOT ask "Tell me about yourself" yet - wait for their response first.

Job Information:
- Job Title: ${jobTitle || 'Not specified'}
- Job Description: ${jobDescription ? jobDescription.substring(0, 1000) : 'Not provided'}

Candidate Resume (for context):
${resumeText ? resumeText.substring(0, 2000) : 'Not provided'}

${interviewerPersona ? `Interviewer Persona: ${interviewerPersona}` : ''}

Current Interview Stage: ${interviewStage || 'beginning'}

Remember: Keep your questions and responses SHORT and CONVERSATIONAL. This is a real-time interview, not a written Q&A.`;

    // Make the OpenAI API call
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 200, // Keep responses short for conversation
    });

    const aiMessage = response.choices[0]?.message?.content;

    if (!aiMessage) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      success: true,
      message: aiMessage,
    });

  } catch (error) {
    console.error('Mock interview API error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      error: 'An error occurred during the interview',
      details: error.message,
    });
  }
}

