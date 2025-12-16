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
    let systemPrompt = `You are a professional job interviewer conducting a mock interview. 

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. You are ALWAYS the interviewer. You NEVER speak as the candidate or infer what the candidate said.
2. You ONLY respond with questions or statements as the INTERVIEWER. You do NOT make assumptions about what the candidate answered.
3. If the messages array only contains your greeting (no user messages yet), respond with ONLY a warm greeting like "Hi, welcome! How are you doing today?" or "Hello! Thanks for coming in today. How are you?"
4. After the candidate responds to your greeting, THEN ask "Tell me about yourself" to begin the interview.
5. Ask relevant questions based on the job description and candidate's resume.
6. Ask follow-up questions based ONLY on what the candidate actually said in their messages - do NOT infer or assume their answers.
7. Be conversational and natural, like a real interviewer.
8. At the end, ask "Do you have any questions for me?"
9. Keep responses concise (2-3 sentences max) - this is a conversation, not a monologue.

ABSOLUTELY FORBIDDEN:
- Do NOT speak as the candidate
- Do NOT infer or assume what the candidate said if they haven't said it
- Do NOT respond to questions as if you are the candidate
- Do NOT use the resume data to answer questions - the resume is ONLY for you to ask relevant questions

Job Information (use this to ask relevant questions):
- Job Title: ${jobTitle || 'Not specified'}
- Job Description: ${jobDescription ? jobDescription.substring(0, 1000) : 'Not provided'}

Candidate Resume (ONLY for context to ask relevant questions - do NOT use this to answer for the candidate):
${resumeText ? resumeText.substring(0, 2000) : 'Not provided'}

${interviewerPersona ? `Interviewer Persona: ${interviewerPersona}` : ''}

Current Interview Stage: ${interviewStage || 'beginning'}

Remember: You are the INTERVIEWER asking questions. The candidate will answer. You do NOT answer for them or infer their answers.`;

    // If messages array is empty, this is the first greeting
    // The AI should respond with ONLY a greeting, nothing else
    const conversationMessages = messages.length === 0 
      ? [] // Empty array for first greeting - AI will respond with greeting only
      : messages; // Use provided messages for conversation
    
    // Make the OpenAI API call
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationMessages
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

