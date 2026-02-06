import { supabase } from '../supabaseClient';

/**
 * Fetch user's credit status and plan info
 * @param {string} userId - User's Supabase ID
 * @returns {Promise<{planId: string, planStatus: string, resumeCredits: number, unlimited: boolean}>}
 */
export async function fetchCreditStatus(userId) {
  if (!userId) {
    return { 
      planId: 'free', 
      planStatus: 'free', 
      resumeCredits: 0, 
      unlimited: false 
    };
  }

  try {
    // Use API endpoint instead of direct Supabase query to bypass RLS issues
    const response = await fetch('/api/credits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'get', userId }),
    });

    if (!response.ok) {
      return { 
        planId: 'free', 
        planStatus: 'free', 
        resumeCredits: 0, 
        unlimited: false 
      };
    }

    const data = await response.json();

    // API returns camelCase keys, so use those directly
    const planId = data?.planId || 'free';
    const planStatus = data?.planStatus || 'free';
    const resumeCredits = data?.resumeCredits ?? 0;
    const unlimited = data?.unlimited ?? false;

    return {
      planId,
      planStatus,
      resumeCredits,
      unlimited,
    };
  } catch (err) {
    console.error('Error in fetchCreditStatus:', err);
    return { 
      planId: 'free', 
      planStatus: 'free', 
      resumeCredits: 0, 
      unlimited: false 
    };
  }
}

/**
 * Consume credits (1 for resume, 5 for interview)
 * @param {string} userId - User's Supabase ID
 * @param {'resume'|'interview'} creditType - resume = 1 credit, interview = 5 credits
 * @returns {Promise<{success: boolean, remainingCredits: number, error?: string}>}
 */
export async function consumeCredits(userId, creditType = 'resume') {
  if (!supabase || !userId) {
    return { success: false, remainingCredits: 0, error: 'Not authenticated' };
  }

  try {
    const response = await fetch('/api/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'consume',
        userId,
        creditType,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        remainingCredits: data.remainingCredits ?? 0,
        error: data.error || 'Failed to consume credit',
      };
    }
    return {
      success: true,
      remainingCredits: data.remainingCredits ?? 0,
    };
  } catch (err) {
    console.error('Error consuming credit:', err);
    return {
      success: false,
      remainingCredits: 0,
      error: 'Network error. Please try again.',
    };
  }
}

/** Consume 1 credit for a tailored resume */
export async function consumeResumeCredit(userId) {
  return consumeCredits(userId, 'resume');
}

/** Consume 5 credits for a mock interview */
export async function consumeInterviewCredit(userId) {
  return consumeCredits(userId, 'interview');
}

