import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSavedResumes } from '../../services/savedResumeService';
import { fetchCreditStatus } from '../../services/creditService';
import { getCachedResume } from '../../utils/resumeCache';
import LoadingSpinner from './LoadingSpinner';
import './MockPage.css';

export default function MockPage({ user }) {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [planId, setPlanId] = useState('free');

  useEffect(() => {
    loadPlanAndResumes();
  }, [user]);

  const loadPlanAndResumes = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const status = await fetchCreditStatus(user.id);
      setPlanId(status.planId || 'free');

      if (status.planId === 'free') {
        setResumes([]);
        setLoading(false);
        return;
      }

      const result = await getSavedResumes(user.id);
      if (result.success) {
        setResumes(result.data || []);
      } else {
        setError(result.error || 'Failed to load resumes');
        setResumes([]);
      }
    } catch (err) {
      console.error('Error loading:', err);
      setError('Failed to load');
      setResumes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = (resumeId) => {
    // Try to get cached resume data
    const cachedResume = getCachedResume(resumeId);
    
    navigate('/mockinterview/start', { 
      state: { 
        resumeId,
        resumeData: cachedResume || null // Pass cached data if available
      } 
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <section className="mock-page">
        <LoadingSpinner message="Loading your resumes..." />
      </section>
    );
  }

  return (
    <section className="mock-page">
      <div className="mock-page-container">
        <div className="mock-page-header">
          <div className="mock-page-title-row">
            <h2 className="mock-page-title">Mock Interviews</h2>
            <div className="mock-page-beta-badge" aria-label="Beta feature">
              Beta
            </div>
          </div>
          <p className="mock-page-subtitle">
            Practice your interview skills with AI-powered mock interviews. Select a saved resume to get started.
          </p>
        </div>

        {error && (
          <div className="error-alert animate-fade-in">
            <span className="material-icons">error_outline</span>
            <span>{error}</span>
          </div>
        )}

        {planId === 'free' ? (
          <div className="empty-mock-state mock-upgrade-required">
            <div className="empty-mock-icon">
              <span className="material-icons">mic</span>
            </div>
            <h3 className="empty-mock-title">Mock interviews require a paid plan</h3>
            <p className="empty-mock-text">
              Buy credits or upgrade to Basic plan for mock interviews.
            </p>
            <a href="/pricing" className="mock-upgrade-link">View plans</a>
          </div>
        ) : resumes.length === 0 ? (
          <div className="empty-mock-state">
            <div className="empty-mock-icon">
              <span className="material-icons">mic</span>
            </div>
            <h3 className="empty-mock-title">No saved resumes yet</h3>
            <p className="empty-mock-text">
              Tailor a resume first to start practicing mock interviews.
              Once you save a tailored resume, it will appear here.
            </p>
          </div>
        ) : (
          <div className="mock-resumes-grid">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="mock-resume-card"
              >
                <div className="mock-resume-card-header">
                  <h3 className="mock-resume-card-title">
                    {resume.job_title || 'Untitled Resume'}
                  </h3>
                </div>
                <div className="mock-resume-card-content">
                  <p className="mock-resume-card-date">
                    <span className="material-icons">schedule</span>
                    {formatDate(resume.created_at)}
                  </p>
                  {resume.job_description && (
                    <p className="mock-resume-card-preview">
                      {resume.job_description.substring(0, 150)}
                      {resume.job_description.length > 150 ? '...' : ''}
                    </p>
                  )}
                </div>
                <div className="mock-resume-card-footer">
                  <button
                    className="start-interview-button"
                    onClick={() => handleStartInterview(resume.id)}
                  >
                    <span className="material-icons">play_arrow</span>
                    Start Interview
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

