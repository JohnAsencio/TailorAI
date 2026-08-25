/**
 * Client service for Tavus realistic video interviews.
 * Creates a conversation via our backend (which calls Tavus) and returns the URL to join.
 */

import { authFetch } from '../utils/authFetch';

/**
 * Create a Tavus conversation for a realistic video mock interview.
 * API validates credits (does not deduct). Credits are deducted client-side after the user joins and the timer starts.
 *
 * @param {Object} params
 * @param {string} params.userId - User's Supabase ID (required for credit consumption)
 * @param {string} [params.resumeText] - Resume text for context
 * @param {string} [params.jobDescription] - Job description for context
 * @param {string} [params.jobTitle] - Job title
 * @param {number} [params.durationMinutes] - Interview length in minutes (persona uses for pacing and wrap-up)
 * @param {string} [params.callbackUrl] - Optional webhook URL for Tavus callbacks
 * @returns {Promise<{ success: boolean, conversationUrl?: string, conversationId?: string, error?: string, remainingCredits?: number }>}
 */
export async function createTavusConversation({
  userId,
  resumeText = '',
  jobDescription = '',
  jobTitle = '',
  durationMinutes,
  callbackUrl,
}) {
  try {
    const response = await authFetch('/api/tavus-create-conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        resumeText,
        jobDescription,
        jobTitle,
        ...(durationMinutes != null ? { durationMinutes } : {}),
        ...(callbackUrl ? { callbackUrl } : {}),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Request failed (${response.status})`,
        remainingCredits: data.remainingCredits ?? 0,
      };
    }

    if (!data.success || !data.conversation_url) {
      return {
        success: false,
        error: data.error || 'No conversation URL returned',
      };
    }

    return {
      success: true,
      conversationUrl: data.conversation_url,
      conversationId: data.conversation_id || null,
    };
  } catch (err) {
    console.error('Tavus create conversation error:', err);
    return {
      success: false,
      error: err.message || 'Failed to start video interview',
    };
  }
}
