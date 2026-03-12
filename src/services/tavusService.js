/**
 * Client service for Tavus realistic video interviews.
 * Creates a conversation via our backend (which calls Tavus) and returns the URL to join.
 */

/**
 * Create a Tavus conversation for a realistic video mock interview.
 * Call this after consuming an interview credit (same as in-app interview).
 *
 * @param {Object} params
 * @param {string} [params.resumeText] - Resume text for context
 * @param {string} [params.jobDescription] - Job description for context
 * @param {string} [params.jobTitle] - Job title
 * @param {number} [params.durationMinutes] - Interview length in minutes (persona uses for pacing and wrap-up)
 * @param {string} [params.callbackUrl] - Optional webhook URL for Tavus callbacks
 * @returns {Promise<{ success: boolean, conversationUrl?: string, conversationId?: string, error?: string }>}
 */
export async function createTavusConversation({
  resumeText = '',
  jobDescription = '',
  jobTitle = '',
  durationMinutes,
  callbackUrl,
}) {
  try {
    const response = await fetch('/api/tavus-create-conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
