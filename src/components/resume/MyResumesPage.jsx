import { useState, useEffect } from 'react';
import { getSavedResumes, getSavedResumeById, deleteSavedResume } from '../../services/savedResumeService';
import PdfViewer from './PdfViewer';
import MyResumePdfDocument from './MyResumePdfDocument';
import { pdf } from '@react-pdf/renderer';
import LoadingSpinner from '../common/LoadingSpinner';
import './MyResumesPage.css';

export default function MyResumesPage({ user, onStartMockInterview }) {
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Load resumes on mount
  useEffect(() => {
    loadResumes();
  }, [user]);

  // Generate PDF when resume is selected
  useEffect(() => {
    if (selectedResume) {
      generatePdf(selectedResume.tailored_resume_text);
    } else {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    }
  }, [selectedResume]);

  const loadResumes = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    const result = await getSavedResumes(user.id);
    
    if (result.success) {
      setResumes(result.data || []);
    } else {
      setError(result.error || 'Failed to load resumes');
    }
    setLoading(false);
  };

  const generatePdf = async (resumeText) => {
    try {
      const blob = await pdf(<MyResumePdfDocument resumeText={resumeText} />).toBlob();
      const blobUrl = URL.createObjectURL(blob);
      setPdfUrl(blobUrl);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF preview');
    }
  };

  const handleResumeClick = async (resumeId) => {
    const result = await getSavedResumeById(resumeId, user.id);
    if (result.success) {
      setSelectedResume(result.data);
    } else {
      setError(result.error || 'Failed to load resume');
    }
  };

  const handleDelete = async (resumeId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this resume?')) {
      return;
    }

    setDeletingId(resumeId);
    const result = await deleteSavedResume(resumeId, user.id);
    
    if (result.success) {
      setResumes(resumes.filter(r => r.id !== resumeId));
      if (selectedResume && selectedResume.id === resumeId) {
        setSelectedResume(null);
      }
    } else {
      setError(result.error || 'Failed to delete resume');
    }
    setDeletingId(null);
  };

  const handleBackToList = () => {
    setSelectedResume(null);
  };

  const handleMockInterview = () => {
    if (selectedResume && onStartMockInterview) {
      onStartMockInterview(selectedResume);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <section className="my-resumes-page">
        <LoadingSpinner message="Loading your resumes..." />
      </section>
    );
  }

  // Detail view
  if (selectedResume) {
    return (
      <section className="my-resumes-page">
        <div className="resume-detail-container">
          <div className="resume-detail-header">
            <button 
              className="back-button"
              onClick={handleBackToList}
            >
              <span className="material-icons">arrow_back</span>
              Back to Resumes
            </button>
            <div className="resume-detail-title-section">
              <h2 className="resume-detail-title">
                {selectedResume.job_title || 'Untitled Resume'}
              </h2>
              <p className="resume-detail-date">
                Created: {formatDate(selectedResume.created_at)}
              </p>
            </div>
            <div className="resume-detail-actions">
              <button
                className="mock-interview-button"
                onClick={handleMockInterview}
              >
                <span className="material-icons">mic</span>
                Start Mock Interview
              </button>
            </div>
          </div>

          {error && (
            <div className="error-alert animate-fade-in">
              <span className="material-icons">error_outline</span>
              <span>{error}</span>
            </div>
          )}

          <div className="resume-detail-content">
            {pdfUrl ? (
              <PdfViewer pdfFileUrl={pdfUrl} />
            ) : (
              <div className="resume-loading">
                <LoadingSpinner message="Generating PDF preview..." />
              </div>
            )}
          </div>

          {selectedResume.job_description && (
            <div className="job-description-section">
              <h3 className="job-description-title">Job Description</h3>
              <div className="job-description-text">
                {selectedResume.job_description}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  // List view
  return (
    <section className="my-resumes-page">
      <div className="my-resumes-container">
        <div className="my-resumes-header">
          <h2 className="my-resumes-title">My Resumes</h2>
          <p className="my-resumes-subtitle">
            View and manage your tailored resumes. Click on any resume to view it or start a mock interview.
          </p>
        </div>

        {error && (
          <div className="error-alert animate-fade-in">
            <span className="material-icons">error_outline</span>
            <span>{error}</span>
          </div>
        )}

        {resumes.length === 0 ? (
          <div className="empty-resumes-state">
            <div className="empty-resumes-icon">
              <span className="material-icons">description</span>
            </div>
            <h3 className="empty-resumes-title">No saved resumes yet</h3>
            <p className="empty-resumes-text">
              When you tailor a resume, it will be saved here automatically. 
              You can then view it or start a mock interview for that role.
            </p>
          </div>
        ) : (
          <div className="resumes-grid">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="resume-card"
                onClick={() => handleResumeClick(resume.id)}
              >
                <div className="resume-card-header">
                  <h3 className="resume-card-title">
                    {resume.job_title || 'Untitled Resume'}
                  </h3>
                  <button
                    className="resume-delete-button"
                    onClick={(e) => handleDelete(resume.id, e)}
                    disabled={deletingId === resume.id}
                    title="Delete resume"
                  >
                    {deletingId === resume.id ? (
                      <span className="material-icons spinning">refresh</span>
                    ) : (
                      <span className="material-icons">delete</span>
                    )}
                  </button>
                </div>
                <div className="resume-card-content">
                  <p className="resume-card-date">
                    <span className="material-icons">schedule</span>
                    {formatDate(resume.created_at)}
                  </p>
                  {resume.job_description && (
                    <p className="resume-card-preview">
                      {resume.job_description.substring(0, 150)}
                      {resume.job_description.length > 150 ? '...' : ''}
                    </p>
                  )}
                </div>
                <div className="resume-card-footer">
                  <span className="resume-card-action">
                    Click to view →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

