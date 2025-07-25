import { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { generateContent } from "./api";
import HighlightedResumeDisplay from "./ResumeDisplay";
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import MyResumePdfDocument from "./MyResumePdfDocument";
import PdfViewer from "./PdfViewer";
import './App.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

function App() {
  const [resumeText, setResumeText] = useState("");
  const [pdfFileUrl, setPdfFileUrl] = useState(null);
  const [tailoredPdfUrl, setTailoredPdfUrl] = useState(null); // NEW
  const [jobDesc, setJobDesc] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [displayResumeMode, setDisplayResumeMode] = useState('empty');
  const fileInputRef = useRef(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [changeSummary, setChangeSummary] = useState(""); // NEW

  const clearMessages = () => {
    setTimeout(() => setErrorMessage(""), 5000);
  };

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

  const handleFileUpload = async (e) => {
    setErrorMessage("");
    const file = e.target.files[0];
    if (!file) {
      setUploadedFileName("");
      setResumeText("");
      setPdfFileUrl(null);
      setOutput("");
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
      setPdfFileUrl(fileUrl);
      setDisplayResumeMode('original');
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
      setPdfFileUrl(null);
      setDisplayResumeMode('original');
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
          setResumeText(result.value);
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

    const prompt = `You are an expert resume editor. Your job is to tailor the following resume to better fit the provided job description and be able to pass ATS systems.
    This system is geared for technical roles, but may be used for other sectors. For technical roles make sure the candidate looks like a high potential candidate for role.
    For SWE roles, focus on results, and turn personal projects into real business value statements. 
Instructions:
- Do NOT invent or fabricate any experience, education, or personal information.
- ONLY make targeted improvements: add relevant keywords, quantify achievements, reword or rearrange bullet points, and re-order sections if it helps.
- Preserve all original personal information and structure.
- Output ONLY the improved resume in plain text, ready to use.
- The resume should be formatted in a professional manner, with clear sections and bullet points.
- The header of each section should be in all caps, bold, and left-aligned.
- Be sure to add key words from the job description (from the job description and qualifications) to the resume.

--- SECTION SELECTION GUIDELINES ---
- **Prioritize sections based on direct relevance to the job description.**
- **NEVER include a separate 'CONTACT' section.** Contact information should always be part of the resume's top header (name, email, phone, LinkedIn, etc.).
- For **technical or professional roles**: Focus on sections like PROFESSIONAL EXPERIENCE, PROJECTS, TECHNICAL SKILLS, EDUCATION, CERTIFICATIONS (if relevant).
    - Only include 'INTERESTS' or 'AWARDS' sections if they directly demonstrate highly relevant skills or achievements for this specific role if not scrap it.
    - If a 'SKILLS' section is included, ensure it emphasizes abilities directly applicable to the job (e.g., programming languages, software tools for tech roles; customer service, teamwork for service roles) and includes keywords to pass ATS systems.
- For **customer-facing or service roles (e.g., fast food, retail)**: Sections like relevant experience, customer service skills, teamwork, and transferable soft skills are more important. 'INTERESTS' or 'AWARDS' may be included if they showcase relevant soft skills or dedication
- For other sectors do the same thing. Only apply sections that are relevant to the job description.
- Only include sections from the original resume that are truly beneficial for the target job.
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
      setOutput(tailoredResume);
      setChangeSummary(summary ? summary.trim() : ""); // NEW
      setDisplayResumeMode('tailored_highlighted');

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
    <div className="app-container animate-fade-in">
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
              className={`tailor-button ${loading ? 'loading' : ''}`}
              disabled={loading || !resumeText}
            >
              {loading ? (
                <span className="flex-center-gap">
                  <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
              {displayResumeMode === 'original' && (pdfFileUrl ? "Original Resume" : "Original Resume")}
              {displayResumeMode === 'tailored_highlighted' && "Tailored Resume"}
            </h2>

            {(displayResumeMode === 'original' && pdfFileUrl) ? (
              <PdfViewer pdfFileUrl={pdfFileUrl} />
            ) : (displayResumeMode === 'tailored_highlighted' && tailoredPdfUrl) ? (
              <PdfViewer pdfFileUrl={tailoredPdfUrl} />
            ) : (
              <HighlightedResumeDisplay
                originalText={resumeText}
                tailoredText={output}
                displayMode={displayResumeMode}
              />
            )}

            {output && (
              <div className="download-button-container">
                <PDFDownloadLink
                  document={<MyResumePdfDocument resumeText={output} />}
                  fileName="tailored_resume.pdf"
                >
                  {({ loading }) =>
                    loading ? (
                      <button className="download-pdf-button loading" disabled>
                        Generating Download...
                      </button>
                    ) : (
                      <button className="download-pdf-button">
                        Download PDF
                      </button>
                    )
                  }
                </PDFDownloadLink>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
