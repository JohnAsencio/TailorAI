import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { generateContent } from "./api";
import ResumePreview from "./ResumePreview";

// Set workerSrc to local worker for Vite compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

function App() {
  const [resumeText, setResumeText] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const clearMessages = () => {
    setTimeout(() => setErrorMessage(""), 5000);
  };

  const handleFileUpload = async (e) => {
    setErrorMessage("");
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
          const result = await mammoth.extractRawText({ arrayBuffer: reader.result });
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
    setErrorMessage("");
    if (!resumeText || !jobDesc) {
      setErrorMessage("Please upload your resume and enter a job description.");
      clearMessages();
      return;
    }

    setLoading(true);
    setOutput("");

    const prompt = `You are an expert resume editor. Your job is to tailor the following resume to better fit the provided job description.

Instructions:
- Do NOT invent or fabricate any experience, education, or personal information.
- ONLY make targeted improvements: add relevant keywords, quantify achievements, reword or rearrange bullet points, and re-order sections if it helps.
- Preserve all original personal information and structure.
- Output ONLY the improved resume in plain text, ready to use.
- The resume should be formatted in a professional manner, with clear sections and bullet points. It should remain in the same format as the original resume.
- The header of each section should be in all caps, bold, and left-aligned. (SUMMARY, SKILLS, EDUCATION, PROFESSIONAL EXPERIENCE, PROJECTS, CERTIFICATIONS, CONTACT, PROFILE, OBJECTIVE, ADDITIONAL, AWARDS, LANGUAGES, INTERESTS, etc, those relevant to the role)

Resume:
${resumeText}

Job Description:
${jobDesc}
`;

    try {
      const result = await generateContent(prompt);
      setOutput(result);
    } catch (error) {
      console.error("Error generating content:", error);
      setErrorMessage("Something went wrong. Please try again.");
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex flex-col items-center font-sans">
      <h1 className="text-4xl font-extrabold mb-8 text-indigo-800 text-center drop-shadow-sm">
        📄 AI Resume Tailor
      </h1>

      <div className="w-full max-w-6xl bg-white p-8 rounded-2xl shadow-xl space-y-8 border border-indigo-200">
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline ml-2">{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div>
            <div className="mb-6">
              <label htmlFor="resume-upload" className="block text-xl font-semibold mb-3 text-indigo-700">
                Upload Your Resume
              </label>
              <input
                id="resume-upload"
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileUpload}
                className="block w-full text-lg text-gray-700 file:mr-4 file:py-2 file:px-4
                           file:rounded-full file:border-0 file:text-lg file:font-semibold
                           file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
              />
            </div>

            {resumeText && (
              <div className="mt-4 mb-6">
                <label className="block text-xl font-semibold mb-2 text-indigo-700">
                  Extracted Resume Preview
                </label>
                <pre className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-sm text-gray-800 max-h-60 overflow-auto whitespace-pre-wrap font-mono shadow-inner">
                  {resumeText}
                </pre>
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="job-description" className="block text-xl font-semibold mb-3 text-indigo-700">
                Job Description
              </label>
              <textarea
                id="job-description"
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                rows="10"
                className="w-full border border-indigo-300 p-4 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 text-lg placeholder-gray-400 shadow-sm"
                placeholder="Paste the job description here..."
              />
            </div>

            <button
              onClick={handleTailor}
              className={`w-full py-3 px-6 rounded-xl text-white text-xl font-bold transition duration-300 ease-in-out transform hover:scale-105 shadow-lg
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
          </div>

          {/* Output Section */}
          <div>
            <h2 className="text-xl font-semibold mb-3 text-indigo-700">🎯 Tailored Resume Output</h2>
            <ResumePreview resumeText={output} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
