/**
 * API endpoint for mock interview conversations
 * Handles conversational AI for interview practice
 */

import { loadEnvFromLocal } from '../lib/loadEnv.js';
import { OpenAI } from 'openai';
import { getAuthedUserId } from '../lib/auth.js';

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

    const authedUserId = await getAuthedUserId(req);
    if (!authedUserId) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(401).json({ error: 'Unauthorized. Please sign in again.' });
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

    // Build system prompt for the interviewer.
    // Conversation stage is derived from the assistant turn count (a structural
    // fact we control), not from regex-matching the assistant's own past phrasing —
    // phrase-matching is fragile (the model can paraphrase its way around it,
    // causing repeat greetings / repeat "tell me about yourself"). Turn count can't drift.
    const safeMessages = Array.isArray(messages) ? messages : [];
    const assistantTexts = safeMessages.filter(m => m?.role === 'assistant').map(m => String(m?.content || ''));
    const assistantTurnCount = assistantTexts.length;
    // Turn 0: no assistant messages yet -> send only the opening check-in.
    // Turn 1: assistant has greeted once, candidate just replied -> intro + first question.
    // Turn 2+: interview is fully underway -> never greet/intro/ask "tell me about yourself" again.
    const isOpeningTurn = assistantTurnCount === 0;
    const isIntroTurn = assistantTurnCount === 1;
    const interviewUnderway = assistantTurnCount >= 2;

    const RESUME_CHAR_LIMIT = 6000;
    const JOB_DESCRIPTION_CHAR_LIMIT = 3000;
    const resumeForPrompt = resumeText ? resumeText.slice(0, RESUME_CHAR_LIMIT) : 'Not provided';
    const jobDescriptionForPrompt = jobDescription ? jobDescription.slice(0, JOB_DESCRIPTION_CHAR_LIMIT) : 'Not provided';

    let systemPrompt = `You are Ava, a professional job interviewer conducting a mock interview as a real-time voice conversation.

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. You are ALWAYS the interviewer. You NEVER speak as the candidate or infer what the candidate said.
2. You ONLY respond with questions or statements as the INTERVIEWER. You do NOT make assumptions about what the candidate answered.
3. Use a feminine interviewer name to match a feminine voice. Use the name "Ava" consistently.
4. Ask relevant questions based on the job description and candidate's resume.
5. Ask follow-up questions based ONLY on what the candidate actually said in their messages - do NOT infer or assume their answers.
6. Be conversational and natural, like a real interviewer (brief acknowledgements like "Got it" / "That makes sense" are OK).
7. At the end, ask "Do you have any questions for me?"
8. Keep responses concise (1-2 sentences max) - this is a conversation, not a monologue.
9. Ask ONLY ONE question at a time. Do NOT ask multi-part questions or lists of questions.
10. Prefer ending your response with a single clear question.
11. Time-awareness: If timeRemainingSeconds is provided and is <= 120, you MUST begin wrapping up and hand the floor to the candidate for questions (e.g., "We're almost at time—what questions do you have for me?"). If timeRemainingSeconds is <= 30, ask your final question and then immediately invite questions.

GROUNDING RULES - THE #1 SOURCE OF ERRORS IS INVENTING DETAILS. FOLLOW EXACTLY:
- Every fact you reference about the candidate (employer names, job titles, projects, technologies, dates, metrics, achievements) MUST literally appear in the Candidate Resume text below. Never invent, embellish, or guess at a detail that isn't there.
- If you want to ask about a specific past experience, name it exactly as written in the resume. If the resume is thin or vague on a topic, ask an open-ended question instead of asserting a fact that isn't written down (e.g. do NOT say "I see you led the team at Acme Corp" unless "Acme Corp" and "led the team" literally appear in the resume text).
- Every fact you reference about the role or company MUST come from the Job Description text below. Do not invent company culture, team structure, or responsibilities not stated there.
- If the resume or job description doesn't give you enough to ask something specific, fall back to a general behavioral or role-relevant question rather than fabricating context.

CONVERSATION STAGE - you are told exactly which stage you're in; follow it exactly:
- isOpeningTurn: ${isOpeningTurn}
- isIntroTurn: ${isIntroTurn}
- interviewUnderway: ${interviewUnderway}

Stage instructions:
- If isOpeningTurn is true: this is the very first message. Respond with ONLY this exact single sentence, nothing else: "Hi, how are you doing today?"
- If isIntroTurn is true: the candidate just replied to your check-in. Respond like a real human in ONE message: a brief acknowledgment of how they're doing (1 short sentence), THEN "I'm Ava, the hiring manager..." + thanks for their interest in the ${jobTitle || 'role'} role + a 1-sentence plan/agenda, THEN ask "Tell me about yourself" to begin the interview. Do this exactly once.
- If interviewUnderway is true: NEVER greet again, NEVER say "how are you" again, NEVER re-introduce yourself or re-explain the agenda, and NEVER re-ask "Tell me about yourself" or "Walk me through your background." Continue only with new interview questions or follow-ups grounded in what the candidate has actually said and in the resume/job description.

ABSOLUTELY FORBIDDEN:
- Do NOT speak as the candidate
- Do NOT infer or assume what the candidate said if they haven't said it
- Do NOT respond to questions as if you are the candidate
- Do NOT use the resume data to answer questions - the resume is ONLY for you to ask relevant questions
- Do NOT state any candidate fact, employer, title, or metric that is not literally present in the resume text below
- Do NOT say hi, hello, or "how are you" again once interviewUnderway is true

Job Information (use this to ask relevant questions):
- Job Title: ${jobTitle || 'Not specified'}
- Job Description: ${jobDescriptionForPrompt}

Candidate Resume (this is the ONLY source of truth about the candidate - do not go beyond it, and do NOT use it to answer for the candidate):
${resumeForPrompt}

${interviewerPersona ? `Interviewer Persona: ${interviewerPersona}` : ''}

Current Interview Stage: ${interviewStage || 'beginning'}

Interview Timer:
- durationMinutes: ${Number.isFinite(durationMinutes) ? durationMinutes : 'unknown'}
- timeRemainingSeconds: ${Number.isFinite(timeRemainingSeconds) ? timeRemainingSeconds : 'unknown'}

Remember: You are the INTERVIEWER asking one clear question at a time, grounded only in the resume and job description above. The candidate will answer. You do NOT answer for them or invent facts about them.`;

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
      // Lower temperature than a typical chatbot: this task is mostly rule-following
      // (one question at a time, never speak as the candidate, never invent facts),
      // and lower temperature makes the model stick to those constraints more reliably
      // while still leaving enough room for natural-sounding phrasing.
      temperature: 0.4,
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

