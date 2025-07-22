import { useState } from "react";
import { generateContent } from "./api";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function App() {
  const [resumeText, setResumeText] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name.split(".").pop().toLowerCase();

    if (fileType === "pdf") {
      const reader = new FileReader();
      reader.onload = async () => {
        const typedArray = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        let text = "";

        for (let i = 0; i < pdf.numPages; i++) {
          const page = await pdf.getPage(i + 1);
          const content = await page.getTextContent();
          text += content.items.map((item) => item.str).join(" ") + "\n";
        }

        setResumeText(text);
      };
      reader.readAsArrayBuffer(file);
    } else if (fileType === "docx") {
      const reader = new FileReader();
      reader.onload = async () => {
        const result = await mammoth.extractRawText({ arrayBuffer: reader.result });
        setResumeText(result.value);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Please upload a PDF or DOCX resume.");
    }
  };

  const handleTailor = async () => {
    setLoading(true);
    const prompt = `Here is a resume:\n${resumeText}\n\nAnd here is a job description:\n${jobDesc}\n\nTailor the resume to better fit the job.`;
    const result = await generateContent(prompt);
    setOutput(result);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center">📄 AI Resume Tailor</h1>

      <div className="w-full max-w-6xl bg-white p-6 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium mb-1">Upload Resume (PDF/DOCX)</label>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileUpload}
              className="block w-full border p-2 rounded"
            />

            <label className="block mt-4 font-medium mb-1">Job Description</label>
            <textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              rows="6"
              className="w-full border border-gray-300 p-2 rounded"
              placeholder="Paste job description here..."
            />
            <button
              onClick={handleTailor}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? "Tailoring..." : "Tailor Resume"}
            </button>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">🎯 Tailored Output</h2>
            <div className="whitespace-pre-wrap p-4 bg-gray-50 border rounded min-h-[300px]">
              {loading
                ? "⏳ Generating..."
                : output || "Generated resume will appear here."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
