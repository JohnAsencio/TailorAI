# Tailor AI

**AI-powered resume tailoring and mock interviews.** Upload your resume and a job description—Tailor AI optimizes your resume for ATS and human reviewers, then helps you practice with role-specific mock interviews.

Built for **job seekers** who want to stand out and **recruiters** who want to see how candidates can tailor their experience to a role.

---

## How It Works

1. **Paste or upload** your resume and the target job description.
2. **Tailor AI** uses advanced language models to align your resume with the job: keywords, skills, and phrasing that match what ATS and recruiters look for.
3. **Review** your tailored resume with an ATS compatibility score and a side-by-side view of changes.
4. **Download** a submission-ready PDF or **save** it to your account for different roles.
5. **Practice** with AI mock interviews tied to saved resumes so you’re ready for the real thing.

Access is **credit-based**: one credit per tailored resume, five credits per mock interview. Free tier includes 2 credits to try; paid plans and one-time credit packs are available.

---

## Features

- **Resume tailoring** — AI rewrites your resume to match any job description while keeping your voice and facts accurate.
- **ATS optimization** — Real-time compatibility scoring and keyword coverage so your resume gets past applicant tracking systems.
- **PDF export** — Professional, submission-ready PDFs.
- **Save & organize** — Save multiple tailored resumes by role (plan-based save limits).
- **Mock interviews** — AI-driven practice interviews based on your resume and the job; voice and text input supported.
- **Plans & credits** — Free tier (2 credits), Basic (10 credits/month), Pro (50 credits/month), Lifetime (unlimited). Buy extra credits anytime.

---

## Tech Stack

- **Frontend:** React, Vite, React Router  
- **Backend:** Vercel serverless functions (Node.js)  
- **Auth & database:** Supabase (PostgreSQL)  
- **AI:** OpenAI API (tailoring + mock interview)  
- **Payments:** Stripe (subscriptions, one-time credit packs, Customer Portal)  
- **PDF:** @react-pdf/renderer  
- **Email:** Resend (welcome + support flows)  
- **Deployment:** Vercel  

---

## Support

**Email:** [johnaasencio@gmail.com](mailto:johnaasencio@gmail.com) — for product questions, feedback, or support.

---

## For Developers

To run the app locally you need Node.js 18+, and to configure environment variables (Supabase, OpenAI, Stripe, Resend, etc.). Use `npm run dev` for frontend-only or `npx vercel dev` for frontend + API. See the codebase and any env/docs in the repo for deployment and Stripe webhook setup.

---

## License

This project is licensed under the MIT License.
