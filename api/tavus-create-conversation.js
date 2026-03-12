/**
 * API endpoint to create a Tavus conversation for realistic video mock interviews.
 * Calls Tavus API with persona_id + replica_id and optional conversational_context
 * (resume + job) so the AI interviewer asks relevant questions.
 * Returns conversation_url for the client to open (new tab or embed).
 */

import { loadEnvFromLocal } from '../lib/loadEnv.js';

loadEnvFromLocal();

const TAVUS_API_KEY = (process.env.TAVUS_API_KEY || '').trim();
const TAVUS_BASE = 'https://tavusapi.com';
const DEFAULT_PERSONA_ID = process.env.TAVUS_INTERVIEWER_PERSONA_ID || 'pdac61133ac5';
const DEFAULT_REPLICA_ID = process.env.TAVUS_INTERVIEWER_REPLICA_ID || 'r5f0577fc829';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Build conversational_context for the Tavus replica. The persona uses this to
 * personalize the greeting and ask role-specific questions. We make the role
 * unmissable and forbid generic defaults (e.g. "customer support specialist").
 * Includes interview length so the persona can pace and wrap up in time.
 */
function buildConversationalContext({ jobTitle, jobDescription, resumeText, durationMinutes }) {
  const title = String(jobTitle || '').trim();
  const roleDisplay = title || '(role not specified)';
  const desc = String(jobDescription || '').trim().slice(0, 1500);
  const resume = String(resumeText || '').trim().slice(0, 2000);
  const duration = Number.isFinite(durationMinutes) && durationMinutes > 0 ? Math.round(durationMinutes) : 30;

  const lines = [
    '--- SCREENING CONTEXT (follow exactly for your greeting and all questions) ---',
    '',
    `ROLE BEING SCREENED FOR: ${roleDisplay}`,
    '',
    'CRITICAL - ROLE IN GREETING:',
    `- In your opening greeting you MUST say this exact role or a short form of it: "${roleDisplay}".`,
    '- Example: "Thanks for your interest in the ' + roleDisplay + ' position" or "Thanks for joining me today for the ' + roleDisplay + ' screening."',
    '- Do NOT say "customer support specialist", "this role", or any other default. Use ONLY the role title above.',
    '',
    `INTERVIEW LENGTH: This screening is ${duration} minutes total.`,
    '- Pace your questions so you can wrap up with a few minutes left.',
    '- When time is running low, briefly wrap up your questions, then say something like: "We have a few minutes left—do you have any questions for me about the role or the team?"',
    '- Leave time for the candidate to ask you questions about the role.',
    '',
  ];
  if (desc) {
    lines.push('JOB DESCRIPTION:');
    lines.push(desc);
    lines.push('');
  }
  if (resume) {
    lines.push('CANDIDATE RESUME (ask questions based on this; do not answer for the candidate):');
    lines.push(resume);
  }
  lines.push('');
  lines.push(`--- Remember: say the role "${roleDisplay}" in your greeting. Do not use "customer support specialist" or any other default. Keep to the ${duration}-minute length and invite candidate questions near the end. ---`);

  const out = lines.join('\n').trim();
  return out || undefined;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    setCors(res);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!TAVUS_API_KEY) {
    setCors(res);
    return res.status(500).json({
      error: 'Tavus API key is not configured. Set TAVUS_API_KEY in environment.',
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      setCors(res);
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  const {
    resumeText = '',
    jobDescription = '',
    jobTitle = '',
    durationMinutes,
    personaId,
    replicaId,
    callbackUrl,
  } = body || {};

  const persona_id = personaId || DEFAULT_PERSONA_ID;
  const replica_id = replicaId || DEFAULT_REPLICA_ID;
  const conversational_context = buildConversationalContext({
    jobTitle,
    jobDescription,
    resumeText,
    durationMinutes,
  });

  const payload = {
    persona_id,
    replica_id,
  };
  if (conversational_context) payload.conversational_context = conversational_context;
  if (callbackUrl && typeof callbackUrl === 'string' && callbackUrl.startsWith('http')) {
    payload.callback_url = callbackUrl;
  }

  // Log that we're sending context (no PII); helps verify persona receives it
  if (conversational_context) {
    console.log('[tavus] Creating conversation with conversational_context length:', conversational_context.length, 'jobTitle present:', !!jobTitle);
  }

  try {
    const response = await fetch(`${TAVUS_BASE}/v2/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TAVUS_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Tavus create conversation error:', response.status, data);
      setCors(res);
      return res.status(response.status >= 500 ? 502 : response.status).json({
        error: data?.message || data?.error || `Tavus API error (${response.status})`,
        details: data?.details,
      });
    }

    const conversation_url = data.conversation_url;
    const conversation_id = data.conversation_id;

    if (!conversation_url) {
      setCors(res);
      return res.status(502).json({
        error: 'Tavus did not return a conversation URL',
        details: data,
      });
    }

    setCors(res);
    return res.status(200).json({
      success: true,
      conversation_url,
      conversation_id: conversation_id || null,
      status: data.status,
    });
  } catch (err) {
    console.error('Tavus create conversation request failed:', err);
    setCors(res);
    return res.status(500).json({
      error: 'Failed to create video interview session',
      details: err.message,
    });
  }
}
