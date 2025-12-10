# 🤖 Tailor AI (Web Application)

A smart, browser-based AI software powered by the OpenAI API designed to automatically customize a master resume and output a ready-to-use PDF document.

Tailor AI provides an intuitive interface where users paste or upload their master resume and a target job description (JD). It uses advanced language model capabilities to identify crucial keywords, required skills, and core responsibilities from the JD, generating a refined, tailored version of the resume that significantly boosts relevance for Applicant Tracking Systems (ATS) and human reviewers.

## ✨ Core Features

* **Web Interface**: Easy-to-use React-based interface for pasting or uploading resume and job description text.
* **Intelligent Keyword Extraction**: Identifies and prioritizes specific technical, soft, and industry-related keywords from the job description.
* **ATS Compatibility Scoring**: Provides a real-time match score between the content of the resume and the demands of the JD.
* **Content Rewriting**: Suggests refined, results-oriented bullet points and phrases based on the JD's language.
* **PDF Output**: Generates the final, optimized resume as a professional, submission-ready PDF file.
* **AI Mock Interviews**: Practice with AI-powered mock interviews tailored to specific job roles.
* **Save & Organize**: Save multiple tailored resumes for different job applications.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Vercel account (for deployment)
- OpenAI API Key
- Supabase account (for authentication)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/johnasencio/tailorai.git
cd tailorai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key
RESEND_API_KEY=your-resend-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

Or pull from Vercel:
```bash
npx vercel env pull .env.local
```

### Local Development

**Option 1: Full stack (recommended for testing API routes)**
```bash
npx vercel dev
```
Opens on `http://localhost:3000` - includes both frontend and API routes.

**Option 2: Frontend only**
```bash
npm run dev
```
Opens on `http://localhost:5173` - frontend only, API routes won't work locally.

### Deployment

This project is configured for Vercel deployment:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel Dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
4. Deploy!

## 🛠️ Tech Stack

- **Frontend**: React + Vite
- **Backend**: Vercel Serverless Functions
- **Authentication**: Supabase Auth
- **Database**: Supabase
- **AI**: OpenAI API
- **PDF Generation**: @react-pdf/renderer
- **Deployment**: Vercel

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

John Asencio - johnaasencio@gmail.com
