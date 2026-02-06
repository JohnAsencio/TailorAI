/**
 * Payment service for handling Stripe checkout sessions
 */

/**
 * Create a Stripe checkout session for a subscription or one-time payment
 * @param {string} planId - The plan identifier ('basic', 'pro', 'lifetime')
 * @param {string} userId - Supabase user id (required for authenticated checkout)
 * @param {string} email - User's email address
 * @returns {Promise<{success: boolean, sessionId?: string, url?: string, error?: string}>}
 */
export async function createCheckoutSession(planId, userId, email) {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
        userId,
        email,
      }),
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      return {
        success: false,
        error: 'Server configuration error. Please ensure Stripe is properly configured.',
      };
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Failed to create checkout session',
      };
    }

    return {
      success: true,
      sessionId: data.sessionId,
      url: data.url,
    };
  } catch (error) {
    console.error('Payment service error:', error);
    
    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: 'Server configuration error. Stripe may not be set up yet. Please contact support.',
      };
    }
    
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
}

/**
 * Redirect to Stripe checkout
 * @param {string} planId - The plan identifier
 * @param {string} userId - Supabase user id
 * @param {string} email - User's email address
 */
export async function redirectToCheckout(planId, userId, email) {
  const result = await createCheckoutSession(planId, userId, email);
  
  if (result.success && result.url) {
    window.location.href = result.url;
  } else {
    alert(result.error || 'Failed to start checkout. Please try again.');
  }
}

