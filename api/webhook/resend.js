/**
 * Webhook endpoint to receive emails from Resend
 * Handles email.received events from Resend webhooks
 */

import { loadEnvFromLocal } from '../utils/loadEnv.js';

// Load env vars for local dev
loadEnvFromLocal();

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
    const event = req.body;

    // Verify this is an email.received event
    if (event.type === 'email.received') {
      const emailData = event.data;
      
      console.log('📧 Email Received:', {
        emailId: emailData.email_id,
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        messageId: emailData.message_id,
        createdAt: emailData.created_at,
        attachments: emailData.attachments?.length || 0,
      });

      // Log email details (check Resend dashboard for received emails - doesn't use quota)
      // TODO: Process the email content
      // You can:
      // - Extract email body from emailData
      // - Process attachments
      // - Store in database
      // - Auto-respond, etc.

      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json({
        success: true,
        message: 'Email received and processed',
        emailId: emailData.email_id,
      });
    }

    // Handle other event types if needed
    console.log('Received Resend event:', event.type);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      success: true,
      message: 'Event received',
      eventType: event.type,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      error: 'An unexpected error occurred',
      details: error.message,
    });
  }
}

