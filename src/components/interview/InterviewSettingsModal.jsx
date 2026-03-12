import { useState, useEffect } from 'react';
import { getSavedResumes } from '../../services/savedResumeService';
import './InterviewSettingsModal.css';

export default function InterviewSettingsModal({
  duration,
  setDuration,
  interviewerPersona,
  setInterviewerPersona,
  resumeData,
  setResumeData,
  resumeId,
  setResumeId,
  user,
  onStart,
  onCancel,
  onLoadResume,
  onStartVideoInterview,
  videoInterviewLoading,
  videoInterviewError,
  videoInterviewOpened,
}) {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResumeSelector, setShowResumeSelector] = useState(false);

  useEffect(() => {
    // Only load resumes if we need to show the selector
    if (showResumeSelector) {
      loadResumes();
    }
  }, [user, showResumeSelector]);

  const loadResumes = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    const result = await getSavedResumes(user.id);
    if (result.success) {
      setResumes(result.data || []);
    }
    setLoading(false);
  };

  const handleResumeSelect = async (id) => {
    setResumeId(id);
    if (onLoadResume) {
      await onLoadResume(id);
    }
    setShowResumeSelector(false);
  };

  const handleChooseAnother = () => {
    setShowResumeSelector(true);
  };

  const canStart = resumeData && duration > 0;

  return (
    <section className="mock-interview-settings-page">
      <div className="simple-section-card">
        <h2 className="settings-modal-title">Configure Mock Interview</h2>
        
        <div className="settings-section">
          <label className="settings-label">
            Resume *
          </label>
          {resumeData ? (
            <div className="selected-resume-display">
              <div className="selected-resume-info">
                <h3 className="selected-resume-title">
                  {resumeData.job_title || 'Untitled Resume'}
                </h3>
                {resumeData.job_description && (
                  <p className="selected-resume-preview">
                    {resumeData.job_description.substring(0, 150)}
                    {resumeData.job_description.length > 150 ? '...' : ''}
                  </p>
                )}
              </div>
              <button
                className="choose-another-button"
                onClick={handleChooseAnother}
              >
                <span className="material-icons">swap_horiz</span>
                Choose Another
              </button>
            </div>
          ) : showResumeSelector ? (
            loading ? (
              <div className="settings-loading">Loading resumes...</div>
            ) : resumes.length === 0 ? (
              <div className="settings-empty">
                <p>No saved resumes found.</p>
                <p>Please tailor a resume first to start a mock interview.</p>
              </div>
            ) : (
              <div className="resume-selector">
                {resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className={`resume-option ${resumeId === resume.id ? 'selected' : ''}`}
                    onClick={() => handleResumeSelect(resume.id)}
                  >
                    <div className="resume-option-header">
                      <h3>{resume.job_title || 'Untitled Resume'}</h3>
                      {resumeId === resume.id && (
                        <span className="material-icons check-icon">check_circle</span>
                      )}
                    </div>
                    {resume.job_description && (
                      <p className="resume-option-preview">
                        {resume.job_description.substring(0, 100)}...
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : null}
        </div>

        <div className="settings-section">
          <label className="settings-label">
            Interview Duration (minutes) *
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="settings-select"
          >
            <option value={15}>15 minutes</option>
            <option value={20}>20 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
          </select>
          <p className="settings-hint">Recommended: 30-45 minutes</p>
        </div>

        <div className="settings-section">
          <label className="settings-label">
            Interviewer Persona (Optional)
          </label>
          <textarea
            value={interviewerPersona}
            onChange={(e) => setInterviewerPersona(e.target.value)}
            placeholder="e.g., 'A friendly tech recruiter at Google' or 'A strict engineering manager at a startup'"
            className="settings-textarea"
            rows="3"
          />
          <p className="settings-hint">
            Describe the type of interviewer you want to practice with. This helps the AI adapt its style.
          </p>
        </div>


        {videoInterviewError && (
          <div className="settings-video-error" role="alert">
            <span className="material-icons">error_outline</span>
            <span>{videoInterviewError}</span>
          </div>
        )}
        {videoInterviewOpened && (
          <p className="settings-video-opened">
            Your video interview opened in a new tab. When you&apos;re done, close it and return here.
          </p>
        )}
        <div className="settings-actions">
          <button className="settings-button secondary" onClick={onCancel}>
            Cancel
          </button>
          {onStartVideoInterview && (
            <button
              type="button"
              className="settings-button video"
              onClick={onStartVideoInterview}
              disabled={!canStart || videoInterviewLoading}
            >
              {videoInterviewLoading ? (
                <>Starting…</>
              ) : (
                <>
                  <span className="material-icons">videocam</span>
                  Video interview
                </>
              )}
            </button>
          )}
          <button
            className="settings-button primary"
            onClick={onStart}
            disabled={!canStart}
          >
            Start in-app interview
          </button>
        </div>
      </div>
    </section>
  );
}

