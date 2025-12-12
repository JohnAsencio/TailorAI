/**
 * Shared function to send welcome email
 * Can be called directly from other serverless functions
 */

import { loadEnvFromLocal } from './loadEnv.js';

// Load env vars for local dev
loadEnvFromLocal();

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

export async function sendWelcomeEmail(email, userName = null) {
  console.log('📧 sendWelcomeEmail function called with:', { email, userName });
  
  if (!email) {
    console.error('❌ Email is required but not provided');
    throw new Error('email is required');
  }

  console.log('🔑 Checking RESEND_API_KEY...');
  if (!RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured - welcome email not sent');
    return { success: false, error: 'Email service not configured' };
  }
  console.log('✅ RESEND_API_KEY is configured');

  try {
    console.log('📧 Sending welcome email via Resend to:', email);
    console.log('🔑 API Key length:', RESEND_API_KEY ? RESEND_API_KEY.length : 0);
    console.log('🌐 Resend API URL: https://api.resend.com/emails');
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error('⏱️ Fetch request timed out after 10 seconds');
    }, 10000); // 10 second timeout
    
    try {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          from: 'Tailor AI <onboarding@resend.dev>',
          to: email,
          subject: 'Welcome to Tailor AI Beta! 🎉',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #4f46e5; margin-bottom: 20px;">Welcome to Tailor AI Beta!</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                ${userName ? `Hi ${userName},` : 'Hi there,'}
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Thank you for joining the Tailor AI beta! We're excited to have you on board and help shape the future of resume tailoring.
              </p>
              
              <div style="background-color: #f0f9ff; border-left: 4px solid #4f46e5; padding: 20px; margin: 20px 0;">
                <h3 style="color: #4f46e5; margin-top: 0;">Your Beta Tester Access:</h3>
                <ul style="color: #333; line-height: 1.8;">
                  <li><strong>3 Free Resume Tailors</strong> - Start tailoring your resume right away!</li>
                  <li><strong>Request More Credits</strong> - If you run out, simply click the "Request More" button and we'll add more credits to your account.</li>
                  <li><strong>Early Access</strong> - Be among the first to try new features and help us improve the product.</li>
                  <li><strong>Direct Feedback</strong> - Your input helps shape Tailor AI's development.</li>
                </ul>
              </div>

              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Ready to get started? Head over to your dashboard and upload your first resume to begin tailoring!
              </p>

              <div style="margin: 30px 0; text-align: center;">
                <a href="https://tailor-ai.app/tailor" 
                   style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                  Start Tailoring
                </a>
              </div>

              <p style="font-size: 14px; line-height: 1.6; color: #666; margin-top: 30px;">
                If you have any questions or feedback, don't hesitate to reach out. We're here to help!
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #666;">
                Happy tailoring!<br>
                The Tailor AI Team
              </p>
            </div>
          `,
        }),
      });
      
      clearTimeout(timeoutId);
      console.log('📬 Resend API response received, status:', emailResponse.status);

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Resend API error:', emailResponse.status, errorData);
        return { success: false, error: 'Failed to send email', details: errorData };
      }

      const emailData = await emailResponse.json();
      console.log('✅ Welcome email sent successfully via Resend:', emailData.id);
      return { success: true, emailId: emailData.id };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('⏱️ Fetch request was aborted due to timeout');
        return { success: false, error: 'Request timeout', details: 'The email request took too long and was cancelled' };
      }
      throw fetchError;
    }
  } catch (emailError) {
    console.error('❌ Error sending welcome email:', emailError.message || emailError);
    console.error('❌ Error type:', emailError.name);
    console.error('❌ Error stack:', emailError.stack);
    return { success: false, error: 'Failed to send email', details: emailError.message };
  }
}

