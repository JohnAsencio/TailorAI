import { loadEnvFromLocal } from './loadEnv.js';
import { Resend } from 'resend';

loadEnvFromLocal();

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const resend = new Resend(RESEND_API_KEY);
const SENDER_EMAIL = 'Tailor AI <waitlist@tailor-ai.app>';

export async function sendWelcomeEmail(email, userName = null) {
  if (!email) {
    return { success: false, error: 'Email is required' };
  }
  if (!RESEND_API_KEY) {
    return { success: false, error: 'Email service not configured' };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [email],
      subject: 'Welcome to Tailor AI Beta!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4f46e5; margin-bottom: 20px;">Welcome to Tailor AI Beta!</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            ${userName ? `Hi ${userName},` : 'Hi there,'}
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Thank you for joining the Tailor AI beta. We're excited to have you on board.
          </p>
          <div style="background-color: #f0f9ff; border-left: 4px solid #4f46e5; padding: 20px; margin: 20px 0;">
            <h3 style="color: #4f46e5; margin-top: 0;">Your Beta Tester Access:</h3>
            <ul style="color: #333; line-height: 1.8;">
              <li><strong>3 Free Resume Tailors</strong> - Start tailoring your resume right away.</li>
              <li><strong>Request More Credits</strong> - Click "Request More" if you run out.</li>
              <li><strong>Early Access</strong> - Be among the first to try new features.</li>
            </ul>
          </div>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Ready to get started? Head over to your dashboard and upload your first resume.
          </p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="https://tailor-ai.app/tailor"
              style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              Start Tailoring
            </a>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #666; margin-top: 30px;">
            Happy tailoring!<br>The Tailor AI Team
          </p>
        </div>
      `,
    });
    if (error) {
      console.error('sendWelcomeEmail: Resend API error', error?.message);
      return { success: false, error: error.name || 'Failed to send email', details: error.message };
    }
    return { success: true, emailId: data.id };
  } catch (sdkError) {
    console.error('sendWelcomeEmail error', sdkError?.message);
    return {
      success: false,
      error: 'An unexpected email sending error occurred',
      details: sdkError?.message,
    };
  }
}
