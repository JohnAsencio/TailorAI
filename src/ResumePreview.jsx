// ResumePreview.jsx
import React from "react";
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import MyResumePdfDocument from "./MyResumePdfDocument";

function ResumePreview({ resumeText, loading }) {
  if (loading) {
    return (
      <div className="text-center text-gray-500 text-lg py-32">
        ⏳ Generating resume and PDF preview...
      </div>
    );
  }

  if (!resumeText || !resumeText.trim()) {
    return (
      <div className="text-center text-gray-400 text-lg py-32">
        The tailored resume will appear here.
        <br />
        <span className="text-sm">(It will be formatted like a real document)</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center px-4 pb-12">
      {/* PDF Preview */}
      <PDFViewer
        className="w-[700px] h-[900px] border border-gray-300 rounded-lg shadow"
        style={{ minHeight: "800px" }}
      >
        <MyResumePdfDocument resumeText={resumeText} />
      </PDFViewer>

      {/* Download PDF Button */}
      <PDFDownloadLink
        document={<MyResumePdfDocument resumeText={resumeText} />}
        fileName="tailored_resume.pdf"
      >
        {({ loading }) =>
          loading ? (
            <button className="mt-8 bg-gray-400 text-white px-6 py-3 rounded-xl font-bold shadow-lg opacity-75 cursor-not-allowed text-lg" disabled>
              Generating Download...
            </button>
          ) : (
            <button className="mt-8 bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition text-lg">
              Download PDF
            </button>
          )
        }
      </PDFDownloadLink>
    </div>
  );
}

export default ResumePreview;