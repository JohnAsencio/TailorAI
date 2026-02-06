/**
 * Create or update app_users on sign-in. New users get free tier; existing users keep plan/credits (only Stripe webhook may change them).
 */

import { loadEnvFromLocal } from './utils/loadEnv.js';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from './utils/sendWelcomeEmail.js';

// Load env vars for local dev
loadEnvFromLocal();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Initialize Supabase admin client (service role)
const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

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

  if (!supabaseAdmin) {
    return res.status(500).json({
      error: 'Supabase service role not configured. Set SUPABASE_SERVICE_ROLE_KEY in environment variables.',
    });
  }

  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      console.error('create-user-profile: missing userId or email');
      return res.status(400).json({
        error: 'userId and email are required',
      });
    }

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (authError || !authUser) {
      console.error('create-user-profile: user not found in auth.users', authError?.message);
      return res.status(404).json({
        error: 'User not found in auth.users',
      });
    }

    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('app_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle to avoid errors if no row exists

    if (checkError && checkError.code !== 'PGRST301') {
      console.error('create-user-profile: error checking existing user', checkError?.message);
    }

    const isNewUser = !existingUser;

    const userData = {
      email: email.toLowerCase().trim(),
      user_id: userId,
    };
    if (isNewUser) {
      userData.plan_id = 'free';
      userData.plan_status = 'free';
      userData.resume_credits = 2;
    }

    const { data, error } = await supabaseAdmin
      .from('app_users')
      .upsert(
        userData,
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (error) {
      console.error('create-user-profile: app_users error', error.code, error.message);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // If table doesn't exist, that's okay - just log a warning
      if (error.message.includes('does not exist') || error.code === '42P01') {
        console.warn('create-user-profile: app_users table does not exist');
        return res.status(200).json({
          success: true,
          skipped: true,
          message: 'app_users table does not exist. User profile creation skipped.',
        });
      }
      
      // If column doesn't exist (like created_at), try without it
      if (error.code === 'PGRST204' && error.message.includes('column')) {
        console.warn('create-user-profile: column missing, retrying without timestamps');
        const retryUserData = {
          email: email.toLowerCase().trim(),
          user_id: userId,
        };
        if (isNewUser) {
          retryUserData.plan_id = 'free';
          retryUserData.plan_status = 'free';
          retryUserData.resume_credits = 2;
        }
        
        const { data: retryData, error: retryError } = await supabaseAdmin
          .from('app_users')
          .upsert(
            retryUserData,
            { onConflict: 'email' }
          )
          .select()
          .single();
          
        if (retryError) {
          console.error('create-user-profile: retry failed', retryError?.message);
          return res.status(500).json({
            error: 'Failed to create user profile',
            details: retryError.message,
            originalError: error.message,
          });
        }
        
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json({
          success: true,
          data: retryData,
          retried: true,
        });
      }
      
      return res.status(500).json({
        error: 'Failed to create user profile',
        details: error.message,
        code: error.code,
      });
    }

    // Send welcome email synchronously (but errors won't block profile creation)
    if (isNewUser) {
      try {
        const userName = authUser.user?.user_metadata?.full_name || authUser.user?.user_metadata?.name || null;
        const result = await sendWelcomeEmail(email.toLowerCase().trim(), userName);
        if (!result.success) {
          console.error('create-user-profile: welcome email failed', result.error);
        }
      } catch (emailError) {
        console.error('create-user-profile: welcome email error', emailError?.message);
      }
    }

    // Send response after processing welcome email attempt
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('create-user-profile error:', error);
    return res.status(500).json({
      error: 'An unexpected error occurred',
      details: error.message,
    });
  }
}

