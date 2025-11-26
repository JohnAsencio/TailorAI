import './MockPage.css';

export default function MockPage() {
  return (
    <section className="simple-section-card animate-fade-in">
      <h2 className="simple-section-title">Mock Interviews</h2>
      <p className="simple-section-text">
        This area will run AI-powered mock interviews for the roles you save on your dashboard. For now, you can
        continue tailoring resumes and checking ATS scores while we wire this to your saved jobs.
      </p>
    </section>
  );
}

