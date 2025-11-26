import { useState, useRef } from "react";
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { extractTextFromPDF, extractTextFromDOCX, getFileType } from "../../services/resumeService";
import { tailorResume } from "../../services/tailorService";
import { checkATSCompatibility } from "../../services/atsService";
import HighlightedResumeDisplay from "./ResumeDisplay";
import PdfViewer from "./PdfViewer";
import MyResumePdfDocument from "./MyResumePdfDocument";
import ATSChecker from "../ats/ATSChecker";
import ATSComparison from "../ats/ATSComparison";
import '../../App.css';

export default function TailorPage() {
  // State variables for resume processing and display
  const [resumeText, setResumeText] = useState("");
  const [pdfFileUrl, setPdfFileUrl] = useState(null);
  const [tailoredPdfUrl, setTailoredPdfUrl] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [displayResumeMode, setDisplayResumeMode] = useState('empty');
  const fileInputRef = useRef(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [atsResultsOriginal, setAtsResultsOriginal] = useState(null);
  const [atsResultsTailored, setAtsResultsTailored] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsCheckingType, setAtsCheckingType] = useState(null);

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
      return;
    }
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
          return;
        }
        setResumeText(text);
      } catch (error) {
        console.error("Error processing PDF:", error);
        setErrorMessage("Failed to extract text from PDF. Try a different file.");
        clearMessages();
        setPdfFileUrl(null);
        setUploadedFileName("");
        setDisplayResumeMode('empty');
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
          return;
        }
        setResumeText(text);
      } catch (error) {
        console.error("Error processing DOCX:", error);
        setErrorMessage("Failed to process DOCX. Try a different file.");
        clearMessages();
        setUploadedFileName("");
        setDisplayResumeMode('empty');
      }
    } else {
      setErrorMessage("Please upload a PDF or DOCX resume.");
      clearMessages();
      setUploadedFileName("");
      setResumeText("");
      setPdfFileUrl(null);
      setDisplayResumeMode('empty');
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
      if (checkType === 'original') {
        setAtsResultsOriginal(results);
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

  // Handles the resume tailoring process with AI
  const handleTailor = async () => {
    setErrorMessage("");
    if (!resumeText || !jobDesc) {
      setErrorMessage("Please upload your resume and enter a job description.");
      clearMessages();
      return;
    }

    setLoading(true);
    setOutput("");
    setTailoredPdfUrl(null);
    setAtsResultsTailored(null);

    try {
      const { tailoredResume, summary } = await tailorResume(resumeText, jobDesc);
      
      setOutput(tailoredResume);
      setChangeSummary(summary);
      setDisplayResumeMode('tailored_highlighted');

      // Generate PDF from tailored resume text
      const blob = await pdf(<MyResumePdfDocument resumeText={tailoredResume} />).toBlob();
      const tailoredBlobUrl = URL.createObjectURL(blob);
      setTailoredPdfUrl(tailoredBlobUrl);
    } catch (error) {
      console.error("Error generating content:", error);
      setErrorMessage("Something went wrong. Please try again.");
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="main-grid-container">
        <section className="section-card">
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
          <button
            onClick={handleTailor}
            className={`tailor-button ${loading ? ' loading' : ''}`}
            disabled={loading || !resumeText}
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
        </section>

        <section className="section-card right-panel">
          <h2 className="right-panel-title">
            {displayResumeMode === 'empty' && "Your Resume Display"}
            {displayResumeMode === 'original' && (pdfFileUrl ? "Original Resume " : "Original Resume ")}
            {displayResumeMode === 'tailored_highlighted' && "Tailored Resume "}
            {loading && "Processing Resume..."}
          </h2>

          {displayResumeMode === 'original' && pdfFileUrl ? (
            <PdfViewer pdfFileUrl={pdfFileUrl} />
          ) : displayResumeMode === 'tailored_highlighted' && tailoredPdfUrl ? (
            <PdfViewer pdfFileUrl={tailoredPdfUrl} />
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

