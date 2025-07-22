import React, { useRef } from "react";
import html2pdf from "html2pdf.js";
import ResumeTemplate from "./ResumeTemplate";

function ResumePreview({ resumeText, loading }) {
  const docRef = useRef();

  const handleDownload = () => {
    if (docRef.current) {
      html2pdf().from(docRef.current).set({
        margin: 0.3,
        filename: "tailored_resume.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      }).save();
    }
  };

  return (
    <div className="w-full h-full animate-fade-in flex flex-col items-center">
      {loading ? (
        <div className="text-center text-gray-500 text-lg py-32">⏳ Generating resume...</div>
      ) : resumeText ? (
        <>
          <div ref={docRef} className="w-full">
            <ResumeTemplate resumeText={resumeText} />
          </div>
          <button
            onClick={handleDownload}
            className="mt-8 bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition text-lg"
          >
            Download PDF
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 text-lg py-32">
          The tailored resume will appear here.<br />
          <span className="text-sm">(It will be formatted like a real document)</span>
        </div>
      )}
    </div>
  );
}

export default ResumePreview;

// Add fade-in animation
// In your global CSS (index.css or App.css), add:
// .animate-fade-in { animation: fadeIn 0.7s cubic-bezier(.4,0,.2,1); }
// @keyframes fadeIn { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: none; } } 