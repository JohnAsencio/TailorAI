import { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { generateContent } from "./api";
import ResumePreview from "./ResumePreview";
import ResumeDiffViewerModal from "./ResumeDiffViewerModal";

// Set workerSrc to local worker for Vite compatibility
// This path refers to pdf.worker.mjs in your public directory
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

function App() {
  const [resumeText, setResumeText] = useState(""); // This is your ORIGINAL resume text
  const [jobDesc, setJobDesc] = useState("");
  const [output, setOutput] = useState(""); // This is your AI-TAILORED resume text
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showDiffModal, setShowDiffModal] = useState(false); // State for the diff modal
  const fileInputRef = useRef();
  const [dragActive, setDragActive] = useState(false);

  const clearMessages = () => {
    setTimeout(() => setErrorMessage(""), 5000);
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleFileUpload = async (e) => {
    setErrorMessage(""); // Clear previous errors
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name.split(".").pop().toLowerCase();

    if (fileType === "pdf") {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const typedArray = new Uint8Array(reader.result);
          const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
          let text = "";

          for (let i = 0; i < pdf.numPages; i++) {
            const page = await pdf.getPage(i + 1);
            const content = await page.getTextContent();
            // Join items with space, and add a newline at the end of each page
            text += content.items.map((item) => item.str).join(" ") + "\n";
          }
          if (!text.trim()) {
            setErrorMessage("The PDF appears to be empty or could not be read. Try a different file.");
            clearMessages();
            return;
          }
          setResumeText(text);
        } catch (error) {
          console.error("Error processing PDF:", error);
          let msg = "Failed to process PDF. ";
          if (error && error.message) msg += error.message;
          else msg += "Try a different file.";
          setErrorMessage(msg);
          clearMessages();
        }
      };
      reader.onerror = (err) => {
        console.error("FileReader error:", err);
        setErrorMessage("Failed to read the PDF file. Try a different file.");
        clearMessages();
      };
      reader.readAsArrayBuffer(file);
    } else if (fileType === "docx") {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          // mammoth.extractRawText returns a promise resolving to { value: string, messages: array }
          const result = await mammoth.extractRawText({ arrayBuffer: reader.result });
          if (!result.value.trim()) {
             setErrorMessage("The DOCX appears to be empty or could not be read. Try a different file.");
             clearMessages();
             return;
          }
          setResumeText(result.value);
        } catch (error) {
          console.error("Error processing DOCX:", error);
          setErrorMessage("Failed to process DOCX. Try a different file.");
          clearMessages();
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setErrorMessage("Please upload a PDF or DOCX resume.");
      clearMessages();
    }
  };

  const handleTailor = async () => {
    setErrorMessage(""); // Clear previous errors
    if (!resumeText || !jobDesc) {
      setErrorMessage("Please upload your resume and enter a job description.");
      clearMessages();
      return;
    }

    setLoading(true); // Start loading state
    setOutput(""); // Clear previous output
    setShowDiffModal(false); // Ensure modal is closed before new generation

    // Your exact prompt string
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
`;

    try {
      const result = await generateContent(prompt);
      setOutput(result); // Set the AI's tailored output
      setShowDiffModal(true); // Open the diff viewer modal after successful generation
    } catch (error) {
      console.error("Error generating content:", error);
      setErrorMessage("Something went wrong. Please try again.");
      clearMessages();
    } finally {
      setLoading(false); // End loading state
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-indigo-800 flex items-center gap-2">
          <span role="img" aria-label="Resume">📄</span> AI Resume Tailor
        </h1>
        <p className="text-gray-500 mt-2 text-center">Tailor your resume for any job in seconds</p>
      </header>
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8 border border-indigo-100">
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline ml-2">{errorMessage}</span>
          </div>
        )}
        {/* Drag and Drop Upload Area */}
        <div
          className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors duration-200 ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-indigo-200 bg-white'}`}
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
            className="hidden"
          />
          <button
            type="button"
            className="mb-2 px-6 py-2 bg-indigo-500 text-white rounded-lg font-semibold shadow hover:bg-indigo-600 transition"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            Click to Upload Resume
          </button>
          <p className="text-gray-500">or drag and drop a PDF or DOCX file here</p>
        </div>
        {/* Job Description Input */}
        <div className="mt-8">
          <label className="block text-lg font-semibold mb-2 text-indigo-700">Job Description</label>
          <textarea
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            rows="8"
            className="w-full rounded-lg border border-indigo-200 p-4 min-h-[120px] focus:ring-2 focus:ring-indigo-400"
            placeholder="Paste the job description here..."
          />
        </div>
        {/* Tailor Button */}
        <button
          onClick={handleTailor}
          className={`w-full mt-6 py-3 px-6 rounded-xl text-white text-xl font-bold transition duration-300 ease-in-out transform hover:scale-105 shadow-lg
            ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Tailoring...
            </span>
          ) : (
            "Tailor Resume"
          )}
        </button>
        {/* Output Section */}
        {output && (
          <div className="mt-10">
            <ResumePreview resumeText={output} loading={loading} />
          </div>
        )}
      </div>
      {/* Diff Viewer Modal */}
      <ResumeDiffViewerModal
        originalText={resumeText}
        tailoredText={output}
        isOpen={showDiffModal}
        onClose={() => setShowDiffModal(false)}
      />
    </div>
  );
}

export default App;