/**
 * Manual helper function to create app_users entry for existing users
 * This can be called via POST request with userId and email
 * 
 * Usage: POST to /api/create-user-profile-manual with { userId: "...", email: "..." }
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
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
        details: authError?.message,
      });
    }

    // Check if app_users entry already exists
    const { data: existingUser } = await supabaseAdmin
      .from('app_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: 'User profile already exists',
        data: existingUser,
      });
    }

    // Create app_users entry
    const { data, error } = await supabaseAdmin
      .from('app_users')
      .insert({
        email: email.toLowerCase().trim(),
        user_id: userId,
        plan_id: 'free',
        plan_name: 'Free',
        plan_status: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating app_users entry:', error);
      // If table doesn't exist, that's okay - just log a warning
      if (error.message.includes('does not exist') || error.code === '42P01') {
        return res.status(200).json({
          success: false,
          skipped: true,
          message: 'app_users table does not exist. Please create it first.',
        });
      }
      return res.status(500).json({
        error: 'Failed to create user profile',
        details: error.message,
      });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      success: true,
      message: 'User profile created successfully',
      data,
    });
  } catch (error) {
    console.error('create-user-profile-manual error:', error);
    return res.status(500).json({
      error: 'An unexpected error occurred',
      details: error.message,
    });
  }
}

