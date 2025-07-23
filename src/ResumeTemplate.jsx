// ResumeTemplate.jsx
import React from "react";

function ResumeTemplate({ resumeText }) {
  console.log("ResumeTemplate received:", resumeText);
  if (!resumeText || !resumeText.trim()) return null;

  // Optional: split into lines
  const lines = resumeText.trim().split(/\r?\n/).filter(line => line.trim() !== "");

  return (
    <div
      className="w-[8.5in] h-[11in] overflow-hidden text-black p-10 bg-white flex flex-col justify-start"
      style={{ boxSizing: "border-box" }}
    >
      {lines.map((line, idx) => (
        <p key={idx} className="text-sm leading-tight mb-1">{line}</p>
      ))}
    </div>
  );
}

export default ResumeTemplate;
