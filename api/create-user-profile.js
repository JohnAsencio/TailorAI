/**
 * Vercel serverless function to create an app_users entry when a user signs up
 * This ensures all users have a profile entry, even if they don't have a subscription yet
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

    console.log('📝 create-user-profile called for:', { userId, email });

    if (!userId || !email) {
      console.error('❌ Missing userId or email');
      return res.status(400).json({
        error: 'userId and email are required',
      });
    }

    // Verify the user exists in auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (authError || !authUser) {
      console.error('❌ User not found in auth.users:', authError);
      return res.status(404).json({
        error: 'User not found in auth.users',
      });
    }

    console.log('✅ User verified in auth.users');

    // Check if user already exists (to determine if this is a new sign-up)
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('app_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle to avoid errors if no row exists

    if (checkError && checkError.code !== 'PGRST301') {
      console.error('❌ Error checking existing user:', checkError);
    }

    const isNewUser = !existingUser;
    console.log('👤 Is new user?', isNewUser);

    // Prepare the data object - only set resume_credits for new users
    // For existing users, preserve their current credits
    const userData = {
      email: email.toLowerCase().trim(),
      user_id: userId,
      plan_id: 'free',
      plan_name: 'Free',
      plan_status: 'free',
    };

    // Only set resume_credits for new users (free tier gets 2 credits to try features)
    if (isNewUser) {
      userData.resume_credits = 2;
    }
    // For existing users, we don't include resume_credits so it preserves the existing value

    // Create or update app_users entry
    // Note: Don't include created_at/updated_at - let the database handle timestamps if they exist
    const { data, error } = await supabaseAdmin
      .from('app_users')
      .upsert(
        userData,
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating app_users entry:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // If table doesn't exist, that's okay - just log a warning
      if (error.message.includes('does not exist') || error.code === '42P01') {
        console.warn('⚠️ app_users table does not exist. Skipping profile creation.');
        return res.status(200).json({
          success: true,
          skipped: true,
          message: 'app_users table does not exist. User profile creation skipped.',
        });
      }
      
      // If column doesn't exist (like created_at), try without it
      if (error.code === 'PGRST204' && error.message.includes('column')) {
        console.warn('⚠️ Column missing in app_users table, retrying without timestamps...');
        // Retry without any timestamp fields - use the same userData logic
        const retryUserData = {
          email: email.toLowerCase().trim(),
          user_id: userId,
          plan_id: 'free',
          plan_name: 'Free',
          plan_status: 'free',
        };
        
        // Only set resume_credits for new users
        if (isNewUser) {
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
          console.error('❌ Retry also failed:', retryError);
          return res.status(500).json({
            error: 'Failed to create user profile',
            details: retryError.message,
            originalError: error.message,
          });
        }
        
        console.log('✅ Successfully created app_users entry on retry');
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
      console.log('📧 New user detected, sending welcome email now');
      console.log('📧 Email:', email);
      console.log('👤 User metadata:', authUser.user?.user_metadata);
      try {
        const userName = authUser.user?.user_metadata?.full_name || authUser.user?.user_metadata?.name || null;
        console.log('👤 User name:', userName);
        const result = await sendWelcomeEmail(email.toLowerCase().trim(), userName);
        console.log('📬 Email function returned:', result);
        if (result.success) {
          console.log('✅ Welcome email sent successfully:', result.emailId);
        } else {
          console.error('❌ Failed to send welcome email:', result.error, result.details);
        }
      } catch (emailError) {
        console.error('❌ Error sending welcome email:', emailError.message || emailError);
        if (emailError.stack) {
          console.error('❌ Stack trace:', emailError.stack);
        }
      }
    } else {
      console.log('ℹ️ User already exists, skipping welcome email');
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

