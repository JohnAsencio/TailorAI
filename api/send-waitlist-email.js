/**
 * Vercel serverless function to send waitlist confirmation email
 * Uses Resend API for email delivery
 */

import { loadEnvFromLocal } from './utils/loadEnv.js';

// Load env vars for local dev
loadEnvFromLocal();

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
//false = off
const RESEND_DRY_RUN = process.env.RESEND_DRY_RUN === 'false';

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

  if (!RESEND_API_KEY) {
    console.warn('⚠️ Resend API key not configured - email will not be sent');
    console.warn('💡 To enable emails: Add RESEND_API_KEY to Vercel environment variables');
    // Return success so waitlist signup doesn't fail, but log that email wasn't sent
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ 
      success: false,
      skipped: true,
      message: 'Email service not configured. Waitlist signup succeeded, but email was not sent.',
      error: 'RESEND_API_KEY not set in environment variables'
    });
  }

  try {
    const { email, interestType } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    // Optional dry run: skip actual send if RESEND_DRY_RUN=true
    if (RESEND_DRY_RUN) {
      console.log('🧪 RESEND_DRY_RUN is enabled - skipping actual email send');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json({
        success: true,
        message: 'Dry run mode: email not sent (RESEND_DRY_RUN=true)',
        dryRun: true
      });
    }

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // For testing without domain verification: use Resend's test domain
        // NOTE: Resend test domain only works for your verified email address
        // For production: verify your domain in Resend and use it here
        // Example: 'Tailor AI <onboarding@tailor-ai.app>'
        from: 'waitlist@tailor-ai.app', // Change to your verified domain when ready
        to: [email],
        subject: 'Welcome to Tailor AI Waitlist! 🎉',
        html: getEmailTemplate(email, interestType),
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Resend API error:', errorData);
      return res.status(500).json({ 
        error: 'Failed to send email',
        details: errorData 
      });
    }

    const data = await emailResponse.json();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ 
      success: true, 
      messageId: data.id 
    });
  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({ 
      error: 'Failed to send email',
      message: error.message 
    });
  }
}

function getEmailTemplate(email, interestType) {
  const interestMessage = interestType 
    ? getInterestMessage(interestType)
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Tailor AI Waitlist</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 You're on the Waitlist!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px; margin-top: 0;">Hi there,</p>
    
    <p>Thank you for joining the Tailor AI waitlist! We're excited to have you on board.</p>
    
    ${interestMessage}
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h2 style="margin-top: 0; color: #4338ca;">What's Next?</h2>
      <ul style="padding-left: 20px;">
        <li>You'll receive exclusive pre-launch offers via email</li>
        <li>Get early access to new features</li>
        <li>Be the first to know when we launch</li>
        <li>Special pricing for waitlist members only</li>
      </ul>
    </div>
    
    <div style="background: #eef2ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
      <h3 style="margin-top: 0; color: #4338ca;">Pre-Launch Specials Available Now:</h3>
      <ul style="padding-left: 20px; margin-bottom: 0;">
        <li><strong>$99 Lifetime Plan</strong> (Regular: $149) - Save $50!</li>
        <li><strong>$6.99/month Unlimited Plan</strong> (Regular: $8.99)</li>
        <li><strong>Beta Tester Access</strong> - Help shape the product</li>
      </ul>
    </div>
    
    <p>We'll keep you updated on our progress and send you exclusive offers as we get closer to launch.</p>
    
    <p style="margin-bottom: 0;">Best regards,<br>
    <strong>The Tailor AI Team</strong></p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
    <p>You're receiving this because you signed up for the Tailor AI waitlist.</p>
    <p>If you didn't sign up, you can safely ignore this email.</p>
  </div>
</body>
</html>
  `;
}

function getInterestMessage(interestType) {
  const messages = {
    lifetime: '<p><strong>We noticed you\'re interested in our Lifetime plan!</strong> Keep an eye out for exclusive pre-launch pricing on lifetime access.</p>',
    monthly: '<p><strong>We noticed you\'re interested in our monthly plans!</strong> We\'ll send you special pricing for our Unlimited and Pro plans.</p>',
    beta: '<p><strong>Thanks for your interest in beta testing!</strong> We\'ll reach out soon with more details about our beta program.</p>',
    general: ''
  };
  
  return messages[interestType] || '';
}

