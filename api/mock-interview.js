/**
 * API endpoint for mock interview conversations
 * Handles conversational AI for interview practice
 */

import { loadEnvFromLocal } from '../lib/loadEnv.js';
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
      interviewStage,
      timeRemainingSeconds,
      durationMinutes
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    // Build system prompt for the interviewer
    const safeMessages = Array.isArray(messages) ? messages : [];
    const lowerText = (v) => String(v || '').toLowerCase();
    const assistantTexts = safeMessages.filter(m => m?.role === 'assistant').map(m => lowerText(m?.content));
    const userTexts = safeMessages.filter(m => m?.role === 'user').map(m => lowerText(m?.content));

    const greetedAlready =
      assistantTexts.some(t => /(^|\b)(hi|hello|welcome|thanks for coming in|thanks for your interest|nice to meet you)(\b|$)/i.test(t)) ||
      assistantTexts.some(t => /how are you( doing)?( today)?\b/i.test(t));
    const toldAboutYourselfAskedAlready =
      assistantTexts.some(t => /\btell me about yourself\b/i.test(t)) ||
      assistantTexts.some(t => /\bwalk me through your background\b/i.test(t));
    const introGivenAlready =
      assistantTexts.some(t => /\bi['’]m ava\b/i.test(t)) ||
      assistantTexts.some(t => /\bi am ava\b/i.test(t)) ||
      assistantTexts.some(t => /\bhiring manager\b/i.test(t)) ||
      assistantTexts.some(t => /\binterview plan\b|\bhere's how\b|\bwe'll\b.*\bquestions\b.*\bquestions\b/i.test(t));
    const interviewUnderway = userTexts.some(t => t.trim().length > 0) && safeMessages.length >= 3;

    let systemPrompt = `You are a professional job interviewer conducting a mock interview as a real-time conversation.

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. You are ALWAYS the interviewer. You NEVER speak as the candidate or infer what the candidate said.
2. You ONLY respond with questions or statements as the INTERVIEWER. You do NOT make assumptions about what the candidate answered.
3. If there are NO user messages yet (very start of the interview), respond with ONLY this exact single sentence (nothing else): "Hi, how are you doing today?"
4. After the candidate responds to the check-in, you MUST respond like a real human: first a brief acknowledgment of how they’re doing (1 short sentence), THEN do your intro + agenda in the same message, THEN transition into the first interview question.
   - Use a feminine interviewer name to match a feminine voice. Use the name "Ava" consistently.
   - Include: "I’m Ava, the hiring manager..." + thanks for interest in the ${jobTitle || 'role'} role + a 1-sentence plan/agenda.
   - Then ask "Tell me about yourself" ONE time to begin the interview—ONLY if you have not asked it already.
5. Once the conversation has started (there is at least one user message), NEVER say hello/hi/how are you again, and NEVER restart the interview. Continue with interview questions or follow-ups only.
6. If the interview is underway, do NOT re-ask "Tell me about yourself" or "Walk me through your background."
7. Ask relevant questions based on the job description and candidate's resume.
8. Ask follow-up questions based ONLY on what the candidate actually said in their messages - do NOT infer or assume their answers.
9. Be conversational and natural, like a real interviewer (brief acknowledgements like "Got it" / "That makes sense" are OK).
10. At the end, ask "Do you have any questions for me?"
11. Keep responses concise (1-2 sentences max) - this is a conversation, not a monologue.
12. Ask ONLY ONE question at a time. Do NOT ask multi-part questions or lists of questions.
13. Prefer ending your response with a single clear question.
14. Time-awareness: If timeRemainingSeconds is provided and is <= 120, you MUST begin wrapping up and hand the floor to the candidate for questions (e.g., "We’re almost at time—what questions do you have for me?"). If timeRemainingSeconds is <= 30, ask your final question and then immediately invite questions.

ABSOLUTELY FORBIDDEN:
- Do NOT speak as the candidate
- Do NOT infer or assume what the candidate said if they haven't said it
- Do NOT respond to questions as if you are the candidate
- Do NOT use the resume data to answer questions - the resume is ONLY for you to ask relevant questions
- Do NOT say hi, hello, or "how are you" again after the conversation has started

State (must follow):
- greetedAlready: ${greetedAlready}
- toldAboutYourselfAskedAlready: ${toldAboutYourselfAskedAlready}
- introGivenAlready: ${introGivenAlready}
- interviewUnderway: ${interviewUnderway}

State rules:
- If greetedAlready is true OR interviewUnderway is true: do NOT greet again and do NOT restart with check-in questions.
- If introGivenAlready is true OR interviewUnderway is true: do NOT re-introduce yourself or re-explain the agenda.
- If toldAboutYourselfAskedAlready is true OR interviewUnderway is true: do NOT ask "Tell me about yourself" again.

Job Information (use this to ask relevant questions):
- Job Title: ${jobTitle || 'Not specified'}
- Job Description: ${jobDescription ? jobDescription.substring(0, 1000) : 'Not provided'}

Candidate Resume (ONLY for context to ask relevant questions - do NOT use this to answer for the candidate):
${resumeText ? resumeText.substring(0, 2000) : 'Not provided'}

${interviewerPersona ? `Interviewer Persona: ${interviewerPersona}` : ''}

Current Interview Stage: ${interviewStage || 'beginning'}

Interview Timer:
- durationMinutes: ${Number.isFinite(durationMinutes) ? durationMinutes : 'unknown'}
- timeRemainingSeconds: ${Number.isFinite(timeRemainingSeconds) ? timeRemainingSeconds : 'unknown'}

Remember: You are the INTERVIEWER asking questions. The candidate will answer. You do NOT answer for them or infer their answers.`;

    // If messages array is empty, this is the first greeting
    // The AI should respond with ONLY a greeting, nothing else
    const rawMessages = safeMessages.length === 0 ? [] : safeMessages;
    // Keep last 50 messages so we never exceed context and the model always sees recent conversation
    const trimmed = rawMessages.slice(-50);
    // OpenAI expects { role, content } only
    const conversationMessages = trimmed.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: typeof m.content === 'string' ? m.content : String(m.content ?? ''),
    }));

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

