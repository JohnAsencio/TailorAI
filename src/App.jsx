import { useState, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { generateContent } from "./api";
import HighlightedResumeDisplay from "./ResumeDisplay";
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import MyResumePdfDocument from "./MyResumePdfDocument";
import PdfViewer from "./PdfViewer";
import './App.css';

// Utility function to clean Markdown formatting from text
function cleanMarkdownFormatting(text) {
  if (!text) return text;
  
  // Remove bold/italic markdown: **text** or __text__ or *text* or _text_
  let cleaned = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, '$2');
  
  // Remove heading markers: # ## ###
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  
  // Remove inline code: `text`
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  
  // Remove links: [text](url) -> text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  return cleaned;
}

// Set the worker source for PDF.js for proper functionality
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

function App() {
  // Theme state: Initializes from localStorage or detects system preference
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    // Detect system preference if no theme is saved
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDarkMode ? 'dark' : 'light';
  });

  // Effect to apply theme class to the body and save to localStorage
  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('theme', theme);

    // Optional: Listen for system theme changes and update if user hasn't manually set a preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only update if the user hasn't explicitly set a theme in localStorage
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    // Cleanup function to remove the event listener when the component unmounts
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]); // Rerun this effect whenever 'theme' state changes

  // Function to toggle between 'light' and 'dark' themes
  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme); // Explicitly save manual choice
      return newTheme;
    });
  };

  // State variables for resume processing and display
  const [resumeText, setResumeText] = useState("");
  const [pdfFileUrl, setPdfFileUrl] = useState(null);
  const [tailoredPdfUrl, setTailoredPdfUrl] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [displayResumeMode, setDisplayResumeMode] = useState('empty'); // 'empty', 'original', 'tailored_highlighted'
  const fileInputRef = useRef(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [atsResultsOriginal, setAtsResultsOriginal] = useState(null);
  const [atsResultsTailored, setAtsResultsTailored] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsCheckingType, setAtsCheckingType] = useState(null); // 'original' or 'tailored'

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
      // Reset all states if no file is selected
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
    const fileType = file.name.split(".").pop().toLowerCase();

    if (fileType === "pdf") {
      const fileUrl = URL.createObjectURL(file);
      setPdfFileUrl(fileUrl); // Set PDF URL for direct viewing
      setDisplayResumeMode('original'); // Set display mode to original PDF

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const typedArray = new Uint8Array(reader.result);
          const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
          let text = "";
          for (let i = 0; i < pdf.numPages; i++) {
            const page = await pdf.getPage(i + 1);
            const content = await page.getTextContent();
            text += content.items.map((item) => item.str).join(" ") + "\n";
          }
          if (!text.trim()) {
            setErrorMessage("The PDF appears to be empty or could not be read. Try a different file.");
            clearMessages();
            setPdfFileUrl(null); // Clear PDF URL if content is empty
            setUploadedFileName("");
            setDisplayResumeMode('empty');
            return;
          }
          setResumeText(text); // Store extracted text for AI processing
        } catch (error) {
          console.error("Error processing PDF:", error);
          setErrorMessage("Failed to extract text from PDF. Try a different file.");
          clearMessages();
          setPdfFileUrl(null); // Clear PDF URL on error
          setUploadedFileName("");
          setDisplayResumeMode('empty');
        }
      };
      reader.onerror = (err) => {
        console.error("FileReader error:", err);
        setErrorMessage("Failed to read the PDF file.");
        clearMessages();
        setPdfFileUrl(null);
        setUploadedFileName("");
        setDisplayResumeMode('empty');
      };
      reader.readAsArrayBuffer(file);
    } else if (fileType === "docx") {
      setPdfFileUrl(null); // No PDF URL for DOCX
      setDisplayResumeMode('original'); // Still displaying original resume, but as text
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const result = await mammoth.extractRawText({ arrayBuffer: reader.result });
          if (!result.value.trim()) {
            setErrorMessage("The DOCX appears to be empty or could not be read.");
            clearMessages();
            setUploadedFileName("");
            setDisplayResumeMode('empty');
            return;
          }
          setResumeText(result.value); // Store extracted text
        } catch (error) {
          console.error("Error processing DOCX:", error);
          setErrorMessage("Failed to process DOCX. Try a different file.");
          clearMessages();
          setUploadedFileName("");
          setDisplayResumeMode('empty');
        }
      };
      reader.readAsArrayBuffer(file);
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
    
    // Clear the specific result being checked
    if (checkType === 'original') {
      setAtsResultsOriginal(null);
    } else {
      setAtsResultsTailored(null);
    }

    const prompt = `You are an expert ATS (Applicant Tracking System) analyzer. Analyze how well the following resume matches the job description and provide a comprehensive ATS compatibility report.

CRITICAL: Output your response in the following EXACT format (use these exact section headers):
---ATS_SCORE---
[Score as a number from 0-100]
---KEYWORD_MATCH---
[Percentage of job description keywords found in resume]
---MATCHING_KEYWORDS---
[List of keywords from job description that ARE found in the resume, separated by commas]
---MISSING_KEYWORDS---
[List of important keywords from job description that are NOT found in the resume, separated by commas]
---FORMATTING_ISSUES---
[List any ATS formatting issues like: tables, images, complex formatting, etc. If none, say "No major formatting issues detected"]
---RECOMMENDATIONS---
[2-4 specific, actionable recommendations to improve ATS compatibility, each on a new line starting with "- "]
---OVERALL_ASSESSMENT---
[A brief 2-3 sentence summary of the resume's ATS compatibility]

Resume:
${textToCheck}

Job Description:
${jobDesc}`;

    try {
      const result = await generateContent(prompt);
      
      // Parse the structured response
      const parseATSSection = (text, sectionName) => {
        const regex = new RegExp(`---${sectionName}---\\s*([\\s\\S]*?)(?=---|$)`);
        const match = text.match(regex);
        return match ? match[1].trim() : '';
      };

      const atsScore = parseATSSection(result, 'ATS_SCORE');
      const keywordMatch = parseATSSection(result, 'KEYWORD_MATCH');
      const matchingKeywords = parseATSSection(result, 'MATCHING_KEYWORDS');
      const missingKeywords = parseATSSection(result, 'MISSING_KEYWORDS');
      const formattingIssues = parseATSSection(result, 'FORMATTING_ISSUES');
      const recommendations = parseATSSection(result, 'RECOMMENDATIONS');
      const overallAssessment = parseATSSection(result, 'OVERALL_ASSESSMENT');

      const results = {
        score: atsScore,
        keywordMatch: keywordMatch,
        matchingKeywords: matchingKeywords.split(',').map(k => k.trim()).filter(k => k),
        missingKeywords: missingKeywords.split(',').map(k => k.trim()).filter(k => k),
        formattingIssues: formattingIssues,
        recommendations: recommendations.split('\n').filter(r => r.trim()).map(r => r.replace(/^-\s*/, '')),
        overallAssessment: overallAssessment
      };

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
    setTailoredPdfUrl(null); // Clear previous tailored PDF URL
    setAtsResultsTailored(null); // Clear tailored ATS results when tailoring new resume

    const prompt = `You are an expert resume editor. Your job is to tailor the following resume to better fit the provided job description and be able to pass ATS systems.
This system is geared for technical roles, but may be used for other sectors. For technical roles make sure the candidate looks like a high potential candidate for role.
For SWE roles, focus on results, and turn personal projects into real business value statements. 

CRITICAL FORMATTING RULES - FOLLOW EXACTLY:
- Output ONLY plain text with NO special formatting characters whatsoever
- DO NOT use asterisks (*), underscores (_), or hash symbols (#) for any formatting
- DO NOT use Markdown, HTML, LaTeX, or any markup language syntax
- Use ALL CAPS for section headers only (e.g., EXPERIENCE, EDUCATION, SKILLS)
- Use simple bullets with a hyphen and space (- ) for bullet points
- Keep all text as plain text without any bold, italic, code blocks, or other markup
- Do not wrap anything in special characters or formatting symbols

Instructions:
- Do NOT invent or fabricate any experience, education, or personal information.
- Key changes are expected. Your primary goal is to maximize the keyword match score. This includes adding relevant quantified achievements and skills that are implied by the candidate's existing experience but explicitly requested by the Job Description.
- If not too farfetched add skills from the job description to the resume, if it will help the candidate pass ATS systems.
- Preserve all original personal information and structure. DO NOT DELETE EVEN SEMI RELEVANT INFORMATION.
- Output ONLY the improved resume in plain text, ready to use.
- The resume should be formatted in a professional manner, with clear sections and bullet points.
- The header of each section should be in all caps and left-aligned.
- Be sure to add key words from the job description (from the job description and qualifications) to the resume.
- Make the candidate look like a high potential fit for the role.

--- SECTION SELECTION GUIDELINES ---
- **Prioritize sections based on direct relevance to the job description.**
- **NEVER include a separate 'CONTACT' section.** Contact information should always be part of the resume's top header (name, email, phone, LinkedIn, etc.).
- For **technical or professional roles**: Focus on sections like PROFESSIONAL EXPERIENCE, PROJECTS, TECHNICAL SKILLS, EDUCATION, CERTIFICATIONS (if relevant).
    - Only include 'INTERESTS' or 'AWARDS' sections if they directly demonstrate highly relevant skills or achievements for this specific role if not scrap it.
    - If a 'SKILLS' section is included, ensure it emphasizes abilities directly applicable to the job (e.g., programming languages, software tools for tech roles; customer service, teamwork for service roles) and includes keywords to pass ATS systems.
- For **customer-facing or service roles (e.g., fast food, retail)**: Sections like relevant experience, customer service skills, teamwork, and transferable soft skills are more important. 'INTERESTS' or 'AWARDS' may be included if they showcase relevant soft skills or dedication.
- For other sectors do the same thing. Only apply sections that are relevant to the job description.
- Only include sections from the original resume that are truly beneficial for the target job, but don't leave out too much such that the word count is significantly reduced.
-------------------------------------

Resume:
${resumeText}

Job Description:
${jobDesc}

After the resume, add a section titled "Summary of Changes:" and list 2-4 bullet points summarizing the key changes you made. Separate the summary from the resume with the line:
---SUMMARY OF CHANGES---
`;

    try {
      const result = await generateContent(prompt);
      const [tailoredResume, summary] = result.split("---SUMMARY OF CHANGES---");
      
      // Clean any Markdown formatting that might have slipped through
      const cleanedResume = cleanMarkdownFormatting(tailoredResume.trim());
      
      setOutput(cleanedResume); // Store tailored text
      setChangeSummary(summary ? summary.trim() : ""); // Store summary of changes
      setDisplayResumeMode('tailored_highlighted'); // Set display mode to tailored

      // Generate PDF from tailored resume text
      const blob = await pdf(<MyResumePdfDocument resumeText={cleanedResume} />).toBlob();
      const tailoredBlobUrl = URL.createObjectURL(blob);
      setTailoredPdfUrl(tailoredBlobUrl); // Store URL for tailored PDF viewer
    } catch (error) {
      console.error("Error generating content:", error);
      setErrorMessage("Something went wrong. Please try again.");
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container animate-fade-in">
      {/* Theme toggle button positioned in its own fixed container */}
      <div className="theme-toggle-container">
        <button
          onClick={toggleTheme}
          className="theme-toggle-button"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {/* Icons are reversed for intuitive interaction: show moon in light mode, sun in dark mode */}
          {theme === 'light' ? (
            <span className="material-icons">dark_mode</span> // In light mode, show moon to suggest switching to dark
          ) : (
            <span className="material-icons">light_mode</span> // In dark mode, show sun to suggest switching to light
          )}
        </button>
      </div>

      <header className="app-header animate-fade-in">
        <div className="app-header-title-group">
          <h1 className="app-header-title">AI Resume Tailor</h1>
        </div>
        <p className="app-header-subtitle">Tailor your resume for any job in seconds</p>
      </header>

      <main className="main-content-area animate-fade-in">
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
            {/* Summary of Changes Display */}
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

            {/* Conditional rendering for the right panel content */}
            {displayResumeMode === 'original' && pdfFileUrl ? (
              // Case 1: Original PDF uploaded and ready to preview
              <PdfViewer pdfFileUrl={pdfFileUrl} />
            ) : displayResumeMode === 'tailored_highlighted' && tailoredPdfUrl ? (
              // Case 2: Tailored PDF generated and ready to preview
              <PdfViewer pdfFileUrl={tailoredPdfUrl} />
            ) : (displayResumeMode === 'original' || displayResumeMode === 'tailored_highlighted') && resumeText && !pdfFileUrl && !tailoredPdfUrl ? (
              // Case 3: Text content is available (e.g., DOCX, or PDF that couldn't render visually),
              // so show the HighlightedResumeDisplay to see the text.
              <HighlightedResumeDisplay
                originalText={resumeText}
                tailoredText={output}
                displayMode={displayResumeMode} // Pass current mode to HighlightedResumeDisplay
              />
            ) : (
              // Case 4: Default empty state or other unhandled state (show empty HighlightedResumeDisplay)
              // This ensures a default message is always shown when no specific content is loaded.
              <HighlightedResumeDisplay
                originalText={""} // Explicitly empty if nothing is loaded
                tailoredText={""}
                displayMode={'empty'} // Force empty display mode for placeholder message
              />
            )}

            {output && ( // Show download button only if output (tailored resume text) exists
              <div className="download-button-container">
                <PDFDownloadLink
                  document={<MyResumePdfDocument resumeText={output} />}
                  fileName="tailored_resume.pdf"
                >
                  {({ loading: downloadLoading }) => // Renamed 'loading' prop to avoid conflict with component's 'loading' state
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

        {/* ATS Check Buttons Section - Below main grid */}
        <section className="ats-buttons-section animate-fade-in">
          <div className="ats-check-buttons-group">
            <button
              onClick={() => handleATSCheck('original')}
              className={`ats-check-button ats-check-original ${atsLoading && atsCheckingType === 'original' ? ' loading' : ''}`}
              disabled={(atsLoading && atsCheckingType !== 'original') || !resumeText || !jobDesc}
              title="Check how well your original resume matches the job description"
            >
              {atsLoading && atsCheckingType === 'original' ? (
                <span className="flex-center-gap">
                  <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing...
                </span>
              ) : (
                <span className="flex-center-gap">
                  <span className="material-icons">description</span>
                  Check Original Resume
                </span>
              )}
            </button>
            <button
              onClick={() => handleATSCheck('tailored')}
              className={`ats-check-button ats-check-tailored ${atsLoading && atsCheckingType === 'tailored' ? ' loading' : ''}`}
              disabled={(atsLoading && atsCheckingType !== 'tailored') || !output || !jobDesc}
              title="Check how well your tailored resume matches the job description"
            >
              {atsLoading && atsCheckingType === 'tailored' ? (
                <span className="flex-center-gap">
                  <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing...
                </span>
              ) : (
                <span className="flex-center-gap">
                  <span className="material-icons">verified</span>
                  Check Tailored Resume
                </span>
              )}
            </button>
          </div>
        </section>

        {/* ATS Results Comparison Section - Below buttons */}
        {(atsResultsOriginal || atsResultsTailored) && (
          <section className="ats-comparison-section animate-fade-in">
            <h2 className="ats-comparison-heading">ATS Compatibility Comparison</h2>
            <div className="ats-comparison-grid">
              {/* Original Resume ATS Results */}
              {atsResultsOriginal && (
                <div className="ats-results-box ats-results-original">
                  <div className="ats-header">
                    <h3 className="ats-heading">Original Resume</h3>
                    <div className="ats-score-circle">
                      <div className="ats-score-number">{atsResultsOriginal.score}</div>
                      <div className="ats-score-label">Score</div>
                    </div>
                  </div>
                  
                  <div className="ats-overall-assessment">
                    {atsResultsOriginal.overallAssessment}
                  </div>

                  <div className="ats-metrics-grid">
                    <div className="ats-metric">
                      <div className="ats-metric-label">Keyword Match</div>
                      <div className="ats-metric-value">{atsResultsOriginal.keywordMatch}</div>
                    </div>
                  </div>

                  {atsResultsOriginal.matchingKeywords.length > 0 && (
                    <div className="ats-section">
                      <h4 className="ats-section-title">
                        <span className="material-icons">check_circle</span>
                        Matching Keywords
                      </h4>
                      <div className="ats-keywords-list matching">
                        {atsResultsOriginal.matchingKeywords.map((keyword, idx) => (
                          <span key={idx} className="ats-keyword-tag matching">{keyword}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {atsResultsOriginal.missingKeywords.length > 0 && (
                    <div className="ats-section">
                      <h4 className="ats-section-title">
                        <span className="material-icons">warning</span>
                        Missing Keywords
                      </h4>
                      <div className="ats-keywords-list missing">
                        {atsResultsOriginal.missingKeywords.map((keyword, idx) => (
                          <span key={idx} className="ats-keyword-tag missing">{keyword}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {atsResultsOriginal.formattingIssues && atsResultsOriginal.formattingIssues !== "No major formatting issues detected" && (
                    <div className="ats-section">
                      <h4 className="ats-section-title">
                        <span className="material-icons">info</span>
                        Formatting Issues
                      </h4>
                      <div className="ats-formatting-issues">{atsResultsOriginal.formattingIssues}</div>
                    </div>
                  )}

                  {atsResultsOriginal.recommendations.length > 0 && (
                    <div className="ats-section">
                      <h4 className="ats-section-title">
                        <span className="material-icons">lightbulb</span>
                        Recommendations
                      </h4>
                      <ul className="ats-recommendations-list">
                        {atsResultsOriginal.recommendations.map((rec, idx) => (
                          <li key={idx} className="ats-recommendation-item">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tailored Resume ATS Results */}
              {atsResultsTailored && (
                <div className="ats-results-box ats-results-tailored">
                  <div className="ats-header">
                    <h3 className="ats-heading">Tailored Resume</h3>
                    <div className="ats-score-circle ats-score-tailored">
                      <div className="ats-score-number">{atsResultsTailored.score}</div>
                      <div className="ats-score-label">Score</div>
                    </div>
                  </div>
                  
                  <div className="ats-overall-assessment">
                    {atsResultsTailored.overallAssessment}
                  </div>

                  <div className="ats-metrics-grid">
                    <div className="ats-metric">
                      <div className="ats-metric-label">Keyword Match</div>
                      <div className="ats-metric-value">{atsResultsTailored.keywordMatch}</div>
                    </div>
                  </div>

                  {atsResultsTailored.matchingKeywords.length > 0 && (
                    <div className="ats-section">
                      <h4 className="ats-section-title">
                        <span className="material-icons">check_circle</span>
                        Matching Keywords
                      </h4>
                      <div className="ats-keywords-list matching">
                        {atsResultsTailored.matchingKeywords.map((keyword, idx) => (
                          <span key={idx} className="ats-keyword-tag matching">{keyword}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {atsResultsTailored.missingKeywords.length > 0 && (
                    <div className="ats-section">
                      <h4 className="ats-section-title">
                        <span className="material-icons">warning</span>
                        Missing Keywords
                      </h4>
                      <div className="ats-keywords-list missing">
                        {atsResultsTailored.missingKeywords.map((keyword, idx) => (
                          <span key={idx} className="ats-keyword-tag missing">{keyword}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {atsResultsTailored.formattingIssues && atsResultsTailored.formattingIssues !== "No major formatting issues detected" && (
                    <div className="ats-section">
                      <h4 className="ats-section-title">
                        <span className="material-icons">info</span>
                        Formatting Issues
                      </h4>
                      <div className="ats-formatting-issues">{atsResultsTailored.formattingIssues}</div>
                    </div>
                  )}

                  {atsResultsTailored.recommendations.length > 0 && (
                    <div className="ats-section">
                      <h4 className="ats-section-title">
                        <span className="material-icons">lightbulb</span>
                        Recommendations
                      </h4>
                      <ul className="ats-recommendations-list">
                        {atsResultsTailored.recommendations.map((rec, idx) => (
                          <li key={idx} className="ats-recommendation-item">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;