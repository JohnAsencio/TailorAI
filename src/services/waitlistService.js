import { supabase } from '../supabaseClient';

/**
 * Send welcome email to waitlist signup
 * @param {string} email - User's email
 * @param {string} interestType - Optional interest type
 * @returns {Promise<void>}
 */
async function sendWaitlistEmail(email, interestType) {
  // Create a timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Email request timeout')), 10000); // 10 second timeout
  });

  try {
    const apiUrl = '/api/send-waitlist-email';
    console.log('📧 Attempting to send email to:', email);
    console.log('📡 API endpoint:', apiUrl);
    
    const response = await Promise.race([
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          interestType,
        }),
      }),
      timeoutPromise,
    ]);

    console.log('📬 Email API response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error('❌ Email API error response:', errorData);
      } catch (e) {
        const text = await response.text();
        errorData = { 
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: text.substring(0, 200) // First 200 chars of response
        };
        console.error('❌ Email API error (non-JSON response):', errorData);
      }
      
      // Provide helpful error messages
      if (response.status === 404 || response.status === 0) {
        throw new Error('Email API endpoint not found. Make sure you are running "vercel dev" or the API is deployed.');
      }
      
      throw new Error(errorData.error || errorData.message || `Failed to send email (${response.status})`);
    }

    const result = await response.json();
    
    // Handle case where email was skipped (e.g., API key not configured)
    if (result.skipped) {
      console.warn('⚠️ Email skipped:', result.message);
      return result; // Still return success, just log that email wasn't sent
    }
    
    console.log('✅ Email API success:', result);
    return result;
  } catch (error) {
    // Log more details about the error
    console.error('❌ Email fetch error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Provide helpful error message for network errors
    if (error.message.includes('timeout') || error.message.includes('Failed to fetch')) {
      throw new Error('Could not reach email API. Make sure "vercel dev" is running on port 3000.');
    }
    
    // Re-throw to be caught by caller
    throw error;
  }
}

/**
 * Join the waitlist by adding an email to the waitlist table
 * @param {string} email - User's email address
 * @param {object} options - Optional parameters
 * @param {string} options.interestType - 'lifetime', 'monthly', 'beta', 'general'
 * @param {string} options.referralSource - Where they came from
 * @param {object} options.metadata - Additional metadata (UTM params, etc.)
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function joinWaitlist(email, options = {}) {
  if (!supabase) {
    return {
      success: false,
      error: 'Database not configured. Please contact support.'
    };
  }

  const normalizedEmail = email.toLowerCase().trim();
  
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return {
      success: false,
      error: 'Please enter a valid email address'
    };
  }

  try {
    // Get current user if logged in
    const { data: { user } } = await supabase.auth.getUser();
    
    // Prepare insert data
    const insertData = {
      email: normalizedEmail,
      created_at: new Date().toISOString()
    };

    // Add optional fields
    if (user?.id) {
      insertData.user_id = user.id;
    }
    
    // If user is already logged in, link immediately
    // Otherwise, it will be linked when they sign up/sign in later
    if (options.interestType) {
      insertData.interest_type = options.interestType;
    }
    if (options.referralSource) {
      insertData.referral_source = options.referralSource;
    }
    if (options.metadata) {
      insertData.metadata = options.metadata;
    }

    // Insert new email
    const { error: insertError } = await supabase
      .from('waitlist')
      .insert([insertData]);

    if (insertError) {
      console.error('Waitlist insert error:', insertError);
      // If it's a duplicate key error, treat it as success
      if (insertError.code === '23505') {
        return {
          success: true,
          message: 'You\'re already on the waitlist!'
        };
      }
      return {
        success: false,
        error: insertError.message || 'Failed to join waitlist'
      };
    }

    // Send welcome email (non-blocking, don't fail if email fails)
    // Use setTimeout to make it truly async and non-blocking
    setTimeout(() => {
      sendWaitlistEmail(normalizedEmail, options.interestType)
        .then(() => {
          console.log('✅ Waitlist welcome email sent successfully to:', normalizedEmail);
        })
        .catch((emailError) => {
          // Log but don't fail the waitlist signup
          console.error('❌ Failed to send waitlist email:', emailError);
          console.error('Email error details:', {
            email: normalizedEmail,
            error: emailError.message,
            stack: emailError.stack
          });
        });
    }, 0);

    return {
      success: true,
      message: 'Successfully joined the waitlist!'
    };
  } catch (error) {
    console.error('Waitlist service error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

/**
 * Get waitlist count (admin function - can be used later)
 * @param {object} filters - Optional filters
 * @param {boolean} filters.converted - Filter by conversion status
 * @param {string} filters.interestType - Filter by interest type
 * @returns {Promise<{success: boolean, count?: number, error?: string}>}
 */
export async function getWaitlistCount(filters = {}) {
  if (!supabase) {
    return {
      success: false,
      error: 'Database not configured'
    };
  }

  try {
    let query = supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    // Apply filters
    if (filters.converted !== undefined) {
      query = query.eq('converted', filters.converted);
    }
    if (filters.interestType) {
      query = query.eq('interest_type', filters.interestType);
    }

    const { count, error } = await query;

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      count: count || 0
    };
  } catch (error) {
    console.error('Get waitlist count error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

/**
 * Link waitlist entry to user account (called when user signs up)
 * @param {string} email - User's email
 * @param {string} userId - User's Supabase ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function linkWaitlistToUser(email, userId) {
  if (!supabase || !email || !userId) {
    return {
      success: false,
      error: 'Missing required parameters'
    };
  }

  try {
    const { error } = await supabase
      .from('waitlist')
      .update({ user_id: userId })
      .eq('email', email.toLowerCase().trim())
      .is('user_id', null); // Only update if not already linked

    if (error) {
      console.error('Link waitlist error:', error);
      return {
        success: false,
        error: error.message || 'Failed to link waitlist entry'
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Link waitlist error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

