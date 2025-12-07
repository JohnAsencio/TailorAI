import { supabase } from '../supabaseClient';

/**
 * Join the waitlist by adding an email to the waitlist table
 * @param {string} email - User's email address
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function joinWaitlist(email) {
  if (!supabase) {
    return {
      success: false,
      error: 'Database not configured. Please contact support.'
    };
  }

  try {
    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('waitlist')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existing) {
      return {
        success: true,
        message: 'You\'re already on the waitlist!'
      };
    }

    // Insert new email
    const { error: insertError } = await supabase
      .from('waitlist')
      .insert([
        {
          email: email.toLowerCase().trim(),
          created_at: new Date().toISOString()
        }
      ]);

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
 * @returns {Promise<{success: boolean, count?: number, error?: string}>}
 */
export async function getWaitlistCount() {
  if (!supabase) {
    return {
      success: false,
      error: 'Database not configured'
    };
  }

  try {
    const { count, error } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

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

