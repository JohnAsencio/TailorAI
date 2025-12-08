import Footer from './Footer';
import './PrivacyPolicy.css';

export default function PrivacyPolicy() {
  return (
    <div className="privacy-policy-page">
      <div className="privacy-policy-container">
        <h1 className="privacy-policy-title">Privacy Policy</h1>
        <p className="privacy-policy-last-updated">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <section className="privacy-policy-section">
          <h2>1. Introduction</h2>
          <p>
            Welcome to Tailor AI ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience while using our resume tailoring and optimization services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
          </p>
        </section>

        <section className="privacy-policy-section">
          <h2>2. Information We Collect</h2>
          <h3>2.1 Information You Provide</h3>
          <p>We collect information that you provide directly to us, including:</p>
          <ul>
            <li><strong>Account Information:</strong> Email address, password, and profile information when you create an account</li>
            <li><strong>Resume Data:</strong> Resume content, job descriptions, and other documents you upload or input into our service</li>
            <li><strong>Usage Data:</strong> Information about how you interact with our services, including tailored resumes and saved documents</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <p>When you use our services, we automatically collect certain information, including:</p>
          <ul>
            <li>Device information (browser type, operating system)</li>
            <li>Usage patterns and preferences</li>
            <li>IP address and general location data</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>

          <h3>2.3 Third-Party Authentication</h3>
          <p>
            If you choose to sign in using Google OAuth, we receive basic profile information (name, email address) from Google. This information is used solely for authentication and account management purposes.
          </p>
        </section>

        <section className="privacy-policy-section">
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our resume tailoring and optimization services</li>
            <li>Process your resume customization requests and generate tailored content</li>
            <li>Authenticate your identity and manage your account</li>
            <li>Communicate with you about your account, our services, and updates</li>
            <li>Analyze usage patterns to improve our services and user experience</li>
            <li>Ensure the security and integrity of our platform</li>
            <li>Comply with legal obligations and protect our rights</li>
          </ul>
        </section>

        <section className="privacy-policy-section">
          <h2>4. Data Storage and Security</h2>
          <p>
            We use industry-standard security measures to protect your information. Your data is stored securely using Supabase, a trusted cloud database provider. We implement appropriate technical and organizational measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information.
          </p>
          <p>
            However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
          </p>
        </section>

        <section className="privacy-policy-section">
          <h2>5. Data Sharing and Disclosure</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
          <ul>
            <li><strong>Service Providers:</strong> We may share information with third-party service providers (such as OpenAI for AI processing and Supabase for data storage) who assist us in operating our services, subject to confidentiality agreements</li>
            <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to valid legal requests</li>
            <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction</li>
            <li><strong>With Your Consent:</strong> We may share information with your explicit consent</li>
          </ul>
        </section>

        <section className="privacy-policy-section">
          <h2>6. AI Processing and Third-Party Services</h2>
          <p>
            Our services use artificial intelligence (AI) provided by OpenAI to tailor and optimize your resume content. When you use our services:
          </p>
          <ul>
            <li>Your resume content and job descriptions are sent to OpenAI's API for processing</li>
            <li>OpenAI processes this data according to their privacy policy and terms of service</li>
            <li>We do not use your data to train OpenAI's models unless explicitly permitted by you</li>
            <li>Processed content is returned to our servers and stored in your account</li>
          </ul>
          <p>
            By using our services, you acknowledge that your resume data will be processed by third-party AI services as necessary to provide the functionality you request.
          </p>
        </section>

        <section className="privacy-policy-section">
          <h2>7. Your Rights and Choices</h2>
          <p>You have the following rights regarding your personal information:</p>
          <ul>
            <li><strong>Access:</strong> You can access and review your account information and stored resumes at any time</li>
            <li><strong>Correction:</strong> You can update or correct your account information through your profile settings</li>
            <li><strong>Deletion:</strong> You can delete your account and all associated data at any time through your account settings</li>
            <li><strong>Data Export:</strong> You can download your resumes and data at any time</li>
            <li><strong>Opt-Out:</strong> You can choose not to provide certain information, though this may limit your ability to use some features</li>
          </ul>
        </section>

        <section className="privacy-policy-section">
          <h2>8. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and maintain your session. You can control cookie preferences through your browser settings, though disabling cookies may affect the functionality of our services.
          </p>
        </section>

        <section className="privacy-policy-section">
          <h2>9. Children's Privacy</h2>
          <p>
            Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately so we can delete it.
          </p>
        </section>

        <section className="privacy-policy-section">
          <h2>10. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. By using our services, you consent to the transfer of your information to these countries.
          </p>
        </section>

        <section className="privacy-policy-section">
          <h2>11. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of our services after such changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="privacy-policy-section">
          <h2>12. Contact Us</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact the website developer at:
          </p>
          <p className="privacy-contact-info">
            <strong>Email:</strong> johnaasencio@gmail.com<br />
            <strong>Website:</strong> <a href="https://tailor-ai.app" className="privacy-link">tailor-ai.app</a>
          </p>
        </section>
      </div>
      <Footer />
    </div>
  );
}

