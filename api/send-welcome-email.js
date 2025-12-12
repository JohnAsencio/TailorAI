/**
 * API endpoint to send welcome email to new beta testers
 * Sends email via Resend when a user signs in for the first time
 */

import { sendWelcomeEmail } from './utils/sendWelcomeEmail.js';

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
    // Parse request body (Vercel serverless functions need this)
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { email, userName } = body;
    
    console.log('📧 Welcome email request received for:', email);

    if (!email) {
      return res.status(400).json({
        error: 'email is required',
      });
    }

    const result = await sendWelcomeEmail(email, userName);

    res.setHeader('Access-Control-Allow-Origin', '*');
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Welcome email sent successfully',
        emailId: result.emailId,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to send email',
        details: result.details,
      });
    }
  } catch (error) {
    console.error('send-welcome-email error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      error: 'An unexpected error occurred',
      details: error.message,
    });
  }
}

