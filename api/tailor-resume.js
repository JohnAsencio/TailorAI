import { OpenAI } from "openai";
import { createClient } from '@supabase/supabase-js';
import { loadEnvFromLocal } from '../lib/loadEnv.js';
import { getAuthedUserId } from '../lib/auth.js';
import { CREDIT_COSTS, getPlanCredits } from '../src/config/pricing.js';

// Load environment variables from .env.local if not already loaded
loadEnvFromLocal();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const FREE_PLAN_CREDITS = 2;

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'OpenAI API key is not configured on the server'
      });
    }

    if (!supabaseAdmin) {
      console.error('Supabase service role not configured');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Database not configured',
      });
    }

    // This endpoint spends a real OpenAI call, so it must be authenticated
    // and credit-gated here rather than relying on the client to have
    // called a separate "consume credit" endpoint first.
    const userId = await getAuthedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized. Please sign in again.' });
    }

    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const { data: userData, error: fetchError } = await supabaseAdmin
      .from('app_users')
      .select('plan_id, plan_status, resume_credits')
      .eq('user_id', userId)
      .single();

    if (fetchError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const planId = userData.plan_id || 'free';
    const planStatus = userData.plan_status || 'free';
    const unlimited = planId === 'lifetime' || planStatus === 'lifetime';

    let currentCredits = userData.resume_credits ?? 0;
    if (!unlimited) {
      const planDefault = getPlanCredits(planId);
      if (currentCredits == null || currentCredits === 0) {
        currentCredits = planDefault ?? (planId === 'free' ? FREE_PLAN_CREDITS : 0);
      }
      if (currentCredits < CREDIT_COSTS.oneResume) {
        return res.status(403).json({
          error: `Insufficient credits. You have ${currentCredits} credits; tailoring a resume requires ${CREDIT_COSTS.oneResume}.`,
          remainingCredits: currentCredits,
        });
      }
    }

    // Initialize OpenAI client with server-side API key
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Make the OpenAI API call
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;

    let remainingCredits = currentCredits;
    if (!unlimited) {
      remainingCredits = currentCredits - CREDIT_COSTS.oneResume;
      await supabaseAdmin
        .from('app_users')
        .update({ resume_credits: remainingCredits, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
    }

    // Return the generated content
    return res.status(200).json({ content, remainingCredits, unlimited });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return res.status(500).json({
      error: 'Failed to generate content',
      message: error.message
    });
  }
}

