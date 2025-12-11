/**
 * Vercel serverless function to create an app_users entry when a user signs up
 * This ensures all users have a profile entry, even if they don't have a subscription yet
 */

import { loadEnvFromLocal } from './utils/loadEnv.js';
import { createClient } from '@supabase/supabase-js';

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
      return res.status(400).json({
        error: 'userId and email are required',
      });
    }

    // Verify the user exists in auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (authError || !authUser) {
      return res.status(404).json({
        error: 'User not found in auth.users',
      });
    }

    // Create or update app_users entry
    // Note: Don't include created_at/updated_at - let the database handle timestamps if they exist
    const { data, error } = await supabaseAdmin
      .from('app_users')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          user_id: userId,
          plan_id: 'free',
          plan_name: 'Free',
          plan_status: 'free',
        },
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
        // Retry without any timestamp fields
        const { data: retryData, error: retryError } = await supabaseAdmin
          .from('app_users')
          .upsert(
            {
              email: email.toLowerCase().trim(),
              user_id: userId,
              plan_id: 'free',
              plan_name: 'Free',
              plan_status: 'free',
            },
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

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
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

