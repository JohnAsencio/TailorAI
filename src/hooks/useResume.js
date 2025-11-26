import { useState, useRef } from "react";

export function useResume() {
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
  const [allowExpansion, setAllowExpansion] = useState(false); // New toggle for allowing AI to add content

  return {
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
  };
}

