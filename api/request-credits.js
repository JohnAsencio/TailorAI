/**
 * API endpoint to handle credit requests during beta testing
 * Sends email notification to admin via Resend
 */

import { loadEnvFromLocal } from './utils/loadEnv.js';

// Load env vars for local dev
loadEnvFromLocal();

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'johnaasencio@gmail.com';

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

  try {
    const { userId, email, userName } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        error: 'userId and email are required',
      });
    }

    // Send email notification via Resend
    if (RESEND_API_KEY) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // Use Resend's test domain for development (only works for verified emails)
            // For production: verify your domain in Resend dashboard and use it here
            from: 'Tailor AI <onboarding@resend.dev>',
            to: ADMIN_EMAIL,
            subject: `🔔 Credit Request from ${email}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4f46e5;">New Credit Request</h2>
                <p>A user has requested more testing credits:</p>
                <ul style="list-style: none; padding: 0;">
                  <li style="margin: 10px 0;"><strong>Email:</strong> ${email}</li>
                  <li style="margin: 10px 0;"><strong>User ID:</strong> ${userId}</li>
                  <li style="margin: 10px 0;"><strong>Name:</strong> ${userName || 'Unknown'}</li>
                  <li style="margin: 10px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</li>
                </ul>
                <p style="margin-top: 20px; color: #666;">
                  You can add credits to this user's account in the Supabase dashboard.
                </p>
              </div>
            `,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          console.error('Resend API error:', errorData);
          // Don't fail the request if email fails - still log it
        } else {
          const emailData = await emailResponse.json();
        }
      } catch (emailError) {
        console.error('request-credits: send email failed', emailError?.message);
      }
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      success: true,
      message: 'Credit request submitted successfully',
    });
  } catch (error) {
    console.error('request-credits error:', error);
    return res.status(500).json({
      error: 'An unexpected error occurred',
      details: error.message,
    });
  }
}

