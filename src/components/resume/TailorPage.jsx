import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { extractTextFromPDF, extractTextFromDOCX, getFileType } from "../../services/resumeService";
import { tailorResume } from "../../services/tailorService";
import { checkATSCompatibility } from "../../services/atsService";
import { saveTailoredResume } from "../../services/savedResumeService";
import { ensureTailoredScoreHigher } from "../../utils/atsAlgorithm";
import { fetchCreditStatus, consumeResumeCredit } from "../../services/creditService";
import HighlightedResumeDisplay from "./ResumeDisplay";
import PdfViewer from "./PdfViewer";
import MyResumePdfDocument from "./MyResumePdfDocument";
import ATSChecker from "../ats/ATSChecker";
import ATSComparison from "../ats/ATSComparison";
import LoadingSpinner from "../common/LoadingSpinner";
import { useState, useEffect } from 'react';
import '../../App.css';

export default function TailorPage({ resumeState, user }) {
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [creditStatus, setCreditStatus] = useState({ resumeCredits: 0, unlimited: false, planId: 'free' });
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [requestingCredits, setRequestingCredits] = useState(false);
  const [vibrating, setVibrating] = useState(false);
  
  // Use state from parent (App.jsx) so it persists across tab switches
  const {
    resumeText,
    setResumeText,
    pdfFileUrl,
    setPdfFileUrl,
    tailoredPdfUrl,
    setTailoredPdfUrl,
    jobDesc,
    setJobDesc,
    output,
    setOutput,
    loading,
    setLoading,
    errorMessage,
    setErrorMessage,
    displayResumeMode,
    setDisplayResumeMode,
    fileInputRef,
    uploadedFileName,
    setUploadedFileName,
    changeSummary,
    setChangeSummary,
    atsResultsOriginal,
    setAtsResultsOriginal,
    atsResultsTailored,
    setAtsResultsTailored,
    atsLoading,
    setAtsLoading,
    atsCheckingType,
    setAtsCheckingType,
    allowExpansion,
    setAllowExpansion,
    additionalContext,
    setAdditionalContext,
  } = resumeState;

  // Local testing bypass flag (when set, we won't show real credits)
  const isBypass = import.meta.env.VITE_BYPASS === 'true';

  // Fetch credit status when user is available
  useEffect(() => {
    let cancelled = false;

    if (!user?.id) {
      setCreditsLoading(false);
      setCreditStatus({ resumeCredits: 0, unlimited: false, planId: 'free' });
      return;
    }

    const loadCredits = async (hasRetried = false) => {
      setCreditsLoading(true);
      try {
        const timeoutMs = 10000; // Allow a bit more time, especially when returning to the tab
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Credit fetch timeout')), timeoutMs)
        );

        let status = await Promise.race([
          fetchCreditStatus(user.id),
          timeoutPromise
        ]);

        // If credits are 0 (new user propagation) and we haven't retried, wait briefly and retry once
        if (!hasRetried && status.resumeCredits === 0) {
          await new Promise(resolve => setTimeout(resolve, 1500));
          const retryTimeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Credit fetch retry timeout')), timeoutMs)
          );
          status = await Promise.race([
            fetchCreditStatus(user.id),
            retryTimeoutPromise
          ]);
        }

        if (!cancelled) {
          setCreditStatus(status);
        }
      } catch (err) {
        // On timeout, retry once before giving up
        if (!hasRetried && (err?.message || '').toLowerCase().includes('timeout')) {
          await new Promise(resolve => setTimeout(resolve, 1500));
          if (!cancelled) {
            return loadCredits(true);
          }
        }
        if (!cancelled) {
          console.error('❌ Error loading credits:', err);
          setCreditStatus({ resumeCredits: 0, unlimited: false, planId: 'free' });
        }
      } finally {
        if (!cancelled) {
          setCreditsLoading(false);
        }
      }
    };

    loadCredits();

    // Refresh credits when coming back to the tab (helps if the first call timed out while inactive)
    const handleVisibilityChange = () => {
      if (!cancelled && document.visibilityState === 'visible') {
        loadCredits();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Refetch credits when subscription/credits updated (e.g. after purchase on another tab or return from Stripe)
  useEffect(() => {
    const handler = () => {
      if (user?.id) {
        fetchCreditStatus(user.id).then(setCreditStatus);
      }
    };
    window.addEventListener('credits-updated', handler);
    return () => window.removeEventListener('credits-updated', handler);
  }, [user?.id]);

  // Function to clear error messages after a delay
  const clearMessages = () => {
    setTimeout(() => setErrorMessage(""), 5000);
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload({ target: { files: e.dataTransfer.files } });
    }
  };

  // Handles file upload (PDF or DOCX)
  const handleFileUpload = async (e) => {
    setErrorMessage("");
    const file = e.target.files[0];
    if (!file) {
      setUploadedFileName("");
      setResumeText("");
      setPdfFileUrl(null);
      setOutput("");
      setTailoredPdfUrl(null);
      setDisplayResumeMode('empty');
      setUploading(false);
      return;
    }
    setUploading(true);
    setUploadedFileName(file.name);
    setOutput("");
    setResumeText("");
    setPdfFileUrl(null);
    setTailoredPdfUrl(null);
    const fileType = getFileType(file.name);

    if (fileType === "pdf") {
      const fileUrl = URL.createObjectURL(file);
      setPdfFileUrl(fileUrl);
      setDisplayResumeMode('original');

      try {
        const text = await extractTextFromPDF(file);
        if (!text.trim()) {
          setErrorMessage("The PDF appears to be empty or could not be read. Try a different file.");
          clearMessages();
          setPdfFileUrl(null);
          setUploadedFileName("");
          setDisplayResumeMode('empty');
          setUploading(false);
          return;
        }
        setResumeText(text);
        setUploading(false);
      } catch (error) {
        console.error("Error processing PDF:", error);
        setErrorMessage("Failed to extract text from PDF. Try a different file.");
        clearMessages();
        setPdfFileUrl(null);
        setUploadedFileName("");
        setDisplayResumeMode('empty');
        setUploading(false);
      }
    } else if (fileType === "docx") {
      setPdfFileUrl(null);
      setDisplayResumeMode('original');
      try {
        const text = await extractTextFromDOCX(file);
        if (!text.trim()) {
          setErrorMessage("The DOCX appears to be empty or could not be read.");
          clearMessages();
          setUploadedFileName("");
          setDisplayResumeMode('empty');
          setUploading(false);
          return;
        }
        setResumeText(text);
        setUploading(false);
      } catch (error) {
        console.error("Error processing DOCX:", error);
        setErrorMessage("Failed to process DOCX. Try a different file.");
        clearMessages();
        setUploadedFileName("");
        setDisplayResumeMode('empty');
        setUploading(false);
      }
    } else {
      setErrorMessage("Please upload a PDF or DOCX resume.");
      clearMessages();
      setUploadedFileName("");
      setResumeText("");
      setPdfFileUrl(null);
      setDisplayResumeMode('empty');
      setUploading(false);
    }
  };

  // Handles ATS checker analysis
  const handleATSCheck = async (checkType) => {
    setErrorMessage("");
    const textToCheck = checkType === 'tailored' ? output : resumeText;
    
    if (!textToCheck || !jobDesc) {
      setErrorMessage("Please upload your resume and enter a job description.");
      clearMessages();
      return;
    }

    if (checkType === 'tailored' && !output) {
      setErrorMessage("Please tailor your resume first before checking the tailored version.");
      clearMessages();
      return;
    }

    setAtsLoading(true);
    setAtsCheckingType(checkType);
    
    if (checkType === 'original') {
      setAtsResultsOriginal(null);
    } else {
      setAtsResultsTailored(null);
    }

    try {
      const results = await checkATSCompatibility(textToCheck, jobDesc);
      
      // Ensure tailored resume always has equal or higher score than original
      if (checkType === 'tailored' && atsResultsOriginal) {
        const adjustedResults = ensureTailoredScoreHigher(results, atsResultsOriginal);
        setAtsResultsTailored(adjustedResults);
      } else if (checkType === 'original') {
        setAtsResultsOriginal(results);
        // If tailored results exist, re-validate them against the new original
        if (atsResultsTailored) {
          const adjustedResults = ensureTailoredScoreHigher(atsResultsTailored, results);
          setAtsResultsTailored(adjustedResults);
        }
      } else {
        setAtsResultsTailored(results);
      }
    } catch (error) {
      console.error("Error running ATS check:", error);
      setErrorMessage("Failed to run ATS check. Please try again.");
      clearMessages();
    } finally {
      setAtsLoading(false);
      setAtsCheckingType(null);
    }
  };

  // Handle credit request
  const handleRequestCredits = async () => {
    if (!user?.id || !user?.email) return;
    
    setRequestingCredits(true);
    try {
      const response = await fetch('/api/request-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          userName: user.email?.split('@')[0] || 'User',
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSaveMessage('Credit request submitted! We\'ll notify you when more credits are added.');
        setTimeout(() => setSaveMessage(''), 5000);
      } else {
        setErrorMessage('Failed to submit request. Please try again.');
        clearMessages();
      }
    } catch (error) {
      console.error('Error requesting credits:', error);
      setErrorMessage('Failed to submit request. Please try again.');
      clearMessages();
    } finally {
      setRequestingCredits(false);
    }
  };

  // Handles the resume tailoring process with AI
  const handleTailor = async () => {
    setErrorMessage("");
    if (!resumeText || !jobDesc) {
      setErrorMessage("Please upload your resume and enter a job description.");
      clearMessages();
      return;
    }

    // Check credits (unless bypass is enabled)
    if (!isBypass && user?.id) {
      if (!creditStatus.unlimited && creditStatus.resumeCredits <= 0) {
        // Vibrate the button
        setVibrating(true);
        setTimeout(() => setVibrating(false), 500);
        setErrorMessage("You're out of credits! Request more below.");
        clearMessages();
        return;
      }
    }

    setLoading(true);
    setOutput("");
    setTailoredPdfUrl(null);
    setAtsResultsTailored(null);

    try {
      const { tailoredResume, summary } = await tailorResume(resumeText, jobDesc, allowExpansion, additionalContext);
      
      setOutput(tailoredResume);
      setChangeSummary(summary);
      setDisplayResumeMode('tailored_highlighted');

      // Generate PDF from tailored resume text
      const blob = await pdf(<MyResumePdfDocument resumeText={tailoredResume} />).toBlob();
      const tailoredBlobUrl = URL.createObjectURL(blob);
      setTailoredPdfUrl(tailoredBlobUrl);

      // Consume credit after successful tailoring (unless bypass or unlimited)
      if (!isBypass && user?.id && !creditStatus.unlimited) {
        const consumeResult = await consumeResumeCredit(user.id);
        if (consumeResult.success) {
          const beforeCredits = creditStatus.resumeCredits;
          const afterCredits = consumeResult.remainingCredits;
          
          // Update credit status
          setCreditStatus(prev => ({
            ...prev,
            resumeCredits: afterCredits,
          }));

        } else {
          console.error('Failed to consume credit:', consumeResult.error);
          // Don't block the user, but log the error
        }
      }
    } catch (error) {
      console.error("Error generating content:", error);
      setErrorMessage("Something went wrong. Please try again.");
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  // Save tailored resume to database
  const handleSaveResume = async () => {
    if (!user) {
      setErrorMessage("Please sign in to save resumes.");
      clearMessages();
      return;
    }

    if (!output) {
      setErrorMessage("Please tailor your resume first before saving.");
      clearMessages();
      return;
    }

    // Validate required fields
    if (!companyName.trim() || !jobTitle.trim()) {
      setErrorMessage("Please enter both company name and job title before saving.");
      clearMessages();
      return;
    }

    setSaving(true);
    setSaveMessage('');
    setErrorMessage('');

    // Combine company and job title for the job title field
    const fullJobTitle = `${jobTitle} at ${companyName}`;

    const result = await saveTailoredResume(
      user.id,
      output,
      jobDesc,
      fullJobTitle,
      resumeText
    );

    if (result.success) {
      setSaveMessage('✓ Resume saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      setCompanyName('');
      setJobTitle('');
    } else {
      setSaveMessage(result.error || 'Failed to save resume');
      setTimeout(() => setSaveMessage(''), 5000);
    }

    setSaving(false);
  };

  return (
    <>
      {/* Credit Display - Top of page */}
      {user && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '0.75rem',
          marginTop: '2rem'
        }}>
          {/* Beta Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.5rem 1rem',
            background: '#d97706',
            borderRadius: '1.5rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'white',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Beta
          </div>

          {/* Credit Button - Always shows credits, turns red when 0 */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: !creditsLoading && !isBypass && !creditStatus.unlimited && creditStatus.resumeCredits <= 0 
              ? '#dc2626' 
              : '#059669',
            borderRadius: '2rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'white',
            boxShadow: !creditsLoading && !isBypass && !creditStatus.unlimited && creditStatus.resumeCredits <= 0
              ? '0 4px 12px rgba(239, 68, 68, 0.3)'
              : '0 4px 12px rgba(16, 185, 129, 0.3)',
            border: 'none',
            cursor: 'default'
          }}>
            {creditsLoading ? (
              <span>Loading credits...</span>
            ) : isBypass ? (
              <span>Credits: <strong>testing</strong></span>
            ) : creditStatus.unlimited ? (
              <span>Plan: <strong>{creditStatus.planId === 'pro' ? 'Pro' : 'Unlimited'}</strong> (Unlimited)</span>
            ) : (
              <span>Credits: <strong>{creditStatus.resumeCredits}</strong> remaining</span>
            )}
          </div>

          {/* Request More Button - Only shows when out of credits */}
          {!isBypass && !creditStatus.unlimited && !creditsLoading && creditStatus.resumeCredits <= 0 && (
            <div 
              onClick={handleRequestCredits}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.5rem 1rem',
                background: 'var(--accent, #4a6fa5)',
                borderRadius: '1.5rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'white',
                boxShadow: '0 2px 6px rgba(74, 111, 165, 0.25)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 111, 165, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(74, 111, 165, 0.25)';
              }}
            >
              Request More
            </div>
          )}
        </div>
      )}

      <div className="main-grid-container">
        <section className="section-card">
          {isBypass && (
            <div
              style={{
                marginBottom: '0.75rem',
                padding: '0.5rem 0.75rem',
                background: 'rgba(74, 111, 165, 0.08)',
                color: 'var(--header-title-color)',
                border: '1px solid rgba(74, 111, 165, 0.2)',
                borderRadius: '8px',
                fontWeight: 600,
              }}
            >
              Testing mode (bypass enabled) — Credits: testing
            </div>
          )}
          <div
            className="upload-area"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="upload-button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload Resume
            </button>
            {uploadedFileName && (
              <div className="uploaded-file-name">
                Selected file: <span className="file-name-medium">{uploadedFileName}</span>
              </div>
            )}
          </div>
          {errorMessage && (
            <div className="error-alert animate-fade-in">
              <span className="material-icons">error_outline</span>
              <span>{errorMessage}</span>
            </div>
          )}
          <div className="job-desc-group">
            <label className="job-desc-label" htmlFor="job-desc">
              Job Description
            </label>
            <textarea
              id="job-desc"
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              rows="7"
              className="job-desc-textarea"
              placeholder="Paste the job description here..."
            />
          </div>
          
          {/* Allow Expansion Toggle */}
          <div className="expansion-toggle-group">
            <label className="expansion-toggle-label" htmlFor="allow-expansion-toggle">
              Allow AI to add keywords
            </label>
            <div className="expansion-toggle-box">
              <label className="expansion-toggle-control">
                <div className="expansion-toggle-switch">
                  <input
                    id="allow-expansion-toggle"
                    type="checkbox"
                    checked={allowExpansion}
                    onChange={(e) => setAllowExpansion(e.target.checked)}
                    className="expansion-toggle-input"
                  />
                  <span className="expansion-toggle-slider"></span>
                </div>
                <span className="expansion-toggle-hint">
                  {allowExpansion 
                    ? "AI can add missing keywords, skills, and believable bullet points."
                    : "AI will only optimize existing content."}
                </span>
              </label>
            </div>
          </div>

          {/* Additional Context Input */}
          <div className="additional-context-group">
            <label className="additional-context-label" htmlFor="additional-context">
              Additional Context (Optional)
            </label>
            <textarea
              id="additional-context"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              rows="3"
              className="additional-context-textarea"
              placeholder="Add any specific instructions, corrections, or context for the AI (e.g., 'Emphasize my leadership experience' or 'Make sure to include keywords in the description')"
            />
            <p className="additional-context-hint">
              Use this to provide specific guidance or corrections if the AI didn't get something right the first time.
            </p>
          </div>

          {/* Company and Job Title Fields */}
          <div className="save-info-group">
            <div className="save-info-row">
              <div className="save-info-field">
                <label className="save-info-label" htmlFor="company-name">
                  Company Name *
                </label>
                <input
                  id="company-name"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="save-info-input"
                  placeholder="e.g., Google"
                />
              </div>
              <div className="save-info-field">
                <label className="save-info-label" htmlFor="job-title-input">
                  Job Title *
                </label>
                <input
                  id="job-title-input"
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="save-info-input"
                  placeholder="e.g., Software Engineer"
                />
              </div>
            </div>
            <p className="save-info-hint">
              * Required when saving your tailored resume
            </p>
          </div>

          <button
            onClick={handleTailor}
            className={`tailor-button ${loading ? ' loading' : ''} ${vibrating ? ' vibrate' : ''}`}
            disabled={loading || !resumeText || (!isBypass && user?.id && !creditStatus.unlimited && creditStatus.resumeCredits <= 0)}
          >
            {loading ? (
              <span className="flex-center-gap">
                <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Tailoring...
              </span>
            ) : (
              <span>Tailor Resume</span>
            )}
          </button>

          {/* Credits Display - Under Tailor Button */}
          {user && !creditsLoading && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '1rem'
            }}>
              <div 
                onClick={!isBypass && !creditStatus.unlimited && creditStatus.resumeCredits <= 0 ? handleRequestCredits : undefined}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: !isBypass && !creditStatus.unlimited && creditStatus.resumeCredits <= 0
                    ? '#dc2626'
                    : '#059669',
                  borderRadius: '1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'white',
                  boxShadow: !isBypass && !creditStatus.unlimited && creditStatus.resumeCredits <= 0
                    ? '0 2px 8px rgba(239, 68, 68, 0.3)'
                    : '0 2px 8px rgba(16, 185, 129, 0.3)',
                  border: 'none',
                  cursor: !isBypass && !creditStatus.unlimited && creditStatus.resumeCredits <= 0 ? 'pointer' : 'default',
                  transition: 'all 0.2s ease'
                }}
              >
                {isBypass ? (
                  <span>Credits: <strong>testing</strong></span>
                ) : creditStatus.unlimited ? (
                  <span>Plan: <strong>{creditStatus.planId === 'pro' ? 'Pro' : 'Unlimited'}</strong> (Unlimited)</span>
                ) : creditStatus.resumeCredits <= 0 ? (
                  <span>Out of testing credits? <strong>Request more</strong></span>
                ) : (
                  <span>Credits: <strong>{creditStatus.resumeCredits}</strong> remaining</span>
                )}
              </div>
            </div>
          )}

        </section>

        <section className="section-card right-panel">
          <h2 className="right-panel-title">
            {loading ? "Processing Resume..." : displayResumeMode === 'empty' && "Your Resume"}
            {!loading && displayResumeMode === 'original' && (pdfFileUrl ? "Original Resume " : "Original Resume ")}
            {!loading && displayResumeMode === 'tailored_highlighted' && "Tailored Resume "}
          </h2>

          {uploading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '400px' 
            }}>
              <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ height: '1.25rem', width: '1.25rem', color: 'var(--accent, #4a6fa5)', animation: 'spin 1s linear infinite' }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : loading ? (
            <LoadingSpinner message="Tailoring your resume to match the job description..." />
          ) : displayResumeMode === 'original' && pdfFileUrl ? (
            <PdfViewer pdfFileUrl={pdfFileUrl} hidePagination={false} />
          ) : displayResumeMode === 'tailored_highlighted' && tailoredPdfUrl ? (
            <PdfViewer pdfFileUrl={tailoredPdfUrl} hidePagination={true} />
          ) : (displayResumeMode === 'original' || displayResumeMode === 'tailored_highlighted') && resumeText && !pdfFileUrl && !tailoredPdfUrl ? (
            <HighlightedResumeDisplay
              originalText={resumeText}
              tailoredText={output}
              displayMode={displayResumeMode}
            />
          ) : (
            <HighlightedResumeDisplay
              originalText={""}
              tailoredText={""}
              displayMode={'empty'}
            />
          )}

          {changeSummary && (
            <div className="summary-of-changes-box animate-fade-in">
              <h3 className="summary-heading">Summary of Changes</h3>
              <ul className="summary-list">
                {changeSummary.split(/\n|•/).filter(line => line.trim()).map((line, idx) => (
                  <li key={idx} className="summary-item">{line.replace(/^[-•\s]+/, '')}</li>
                ))}
              </ul>
            </div>
          )}

          {output && (
            <div className="download-button-container">
              <PDFDownloadLink
                document={<MyResumePdfDocument resumeText={output} />}
                fileName="tailored_resume.pdf"
              >
                {({ loading: downloadLoading }) =>
                  downloadLoading ? (
                    <button className="download-pdf-button loading" disabled>
                      Generating Download...
                    </button>
                  ) : (
                    <button className="download-pdf-button">
                      <span className="material-icons">download</span>
                      Download PDF
                    </button>
                  )
                }
              </PDFDownloadLink>
            </div>
          )}

          {/* Save Resume Button - Free plan: show upgrade CTA; paid: save (with limit enforced by API) */}
          {output && user && (
            <div className="save-resume-section">
              {saveMessage && (
                <div className={`save-message ${saveMessage.includes('✓') ? 'success' : 'error'}`}>
                  {saveMessage}
                </div>
              )}
              {!isBypass && creditStatus.planId === 'free' ? (
                <div className="save-resume-upgrade-cta">
                  <p className="save-resume-upgrade-text">Upgrade to Basic or higher to save resumes.</p>
                  <a href="/pricing" className="save-resume-upgrade-link">View plans</a>
                </div>
              ) : (
                <button
                  onClick={handleSaveResume}
                  className={`save-resume-button ${saving ? 'loading' : ''}`}
                  disabled={saving || !output}
                >
                  {saving ? (
                    <span className="flex-center-gap">
                      <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    <>
                      <span className="material-icons">save</span>
                      Save Resume
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      <ATSChecker
        onCheckOriginal={() => handleATSCheck('original')}
        onCheckTailored={() => handleATSCheck('tailored')}
        atsLoading={atsLoading}
        atsCheckingType={atsCheckingType}
        disabledOriginal={!resumeText || !jobDesc}
        disabledTailored={!output || !jobDesc}
      />

      {(atsResultsOriginal || atsResultsTailored) && (
        <ATSComparison
          originalResults={atsResultsOriginal}
          tailoredResults={atsResultsTailored}
        />
      )}
    </>
  );
}

