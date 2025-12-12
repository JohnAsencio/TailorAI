import { supabase } from '../supabaseClient';

/**
 * Fetch user's credit status and plan info
 * @param {string} userId - User's Supabase ID
 * @returns {Promise<{planId: string, planStatus: string, resumeCredits: number, unlimited: boolean}>}
 */
export async function fetchCreditStatus(userId) {
  if (!supabase || !userId) {
    return { 
      planId: 'free', 
      planStatus: 'free', 
      resumeCredits: 0, 
      unlimited: false 
    };
  }

  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('plan_id, plan_status, resume_credits')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching credit status:', error);
      return { 
        planId: 'free', 
        planStatus: 'free', 
        resumeCredits: 0, 
        unlimited: false 
      };
    }

    const planId = data?.plan_id || 'free';
    const planStatus = data?.plan_status || 'free';
    const resumeCredits = data?.resume_credits ?? 0;
    
    // Unlimited plans don't consume credits
    const unlimited = ['unlimited', 'pro'].includes(planId) || planStatus === 'lifetime';

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
 * Consume a resume credit
 * @param {string} userId - User's Supabase ID
 * @returns {Promise<{success: boolean, remainingCredits: number, error?: string}>}
 */
export async function consumeResumeCredit(userId) {
  if (!supabase || !userId) {
    return { success: false, remainingCredits: 0, error: 'Not authenticated' };
  }

  try {
    const response = await fetch('/api/consume-credit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        creditType: 'resume',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        remainingCredits: 0,
        error: data.error || 'Failed to consume credit',
      };
    }

    return {
      success: true,
      remainingCredits: data.remainingCredits || 0,
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

