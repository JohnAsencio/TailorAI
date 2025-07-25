import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css'; // Required for annotations
import 'react-pdf/dist/Page/TextLayer.css'; // Required for text layer

// Set workerSrc for react-pdf.
// This path assumes pdf.worker.mjs (and its .map file)
// has been copied from node_modules/pdfjs-dist/build/
// to your project's public/ directory.
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;

function PdfViewer({ pdfFileUrl }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loadingError, setLoadingError] = useState(null);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1); // Reset to first page on new document load
    setLoadingError(null); // Clear any previous errors
  }

  function onDocumentLoadError(error) {
    console.error("Error loading PDF document:", error);
    // Provide a more user-friendly message for common PDF loading issues.
    let errorMessage = "Failed to load PDF. ";
    if (error.name === "UnknownErrorException" && error.message.includes("Worker version")) {
      errorMessage += "There might be a version mismatch with the PDF viewer's worker file. Please ensure 'pdf.worker.mjs' and 'pdf.worker.mjs.map' are correctly copied to your public folder from 'node_modules/pdfjs-dist/build/'.";
    } else if (error.name === "PasswordException") {
      errorMessage += "The PDF is password-protected.";
    } else if (error.name === "InvalidPDFException") {
      errorMessage += "The PDF file is corrupted or not a valid PDF.";
    } else {
      errorMessage += "It might be corrupted, password-protected, or an unknown error occurred.";
    }
    setLoadingError(errorMessage);
    setNumPages(null);
    setPageNumber(1);
  }

  const goToPrevPage = () => {
    setPageNumber((prevPageNumber) => Math.max(1, prevPageNumber - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prevPageNumber) => Math.min(numPages, prevPageNumber + 1));
  };

  return (
    <div className="pdf-viewer-container">
      {pdfFileUrl ? (
        <>
          {loadingError && (
            <div className="error-alert animate-fade-in">
              <span className="material-icons">error_outline</span>
              <span>{loadingError}</span>
            </div>
          )}
          <Document
            file={pdfFileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            className="pdf-document"
          >
            <Page
              pageNumber={pageNumber}
              renderTextLayer={true} // Enable text layer for selection/copy
              renderAnnotationLayer={true} // Enable annotation layer
              className="pdf-page"
            />
          </Document>
          {numPages && (
            <div className="pdf-navigation">
              <button onClick={goToPrevPage} disabled={pageNumber <= 1} className="pdf-nav-button">
                Previous
              </button>
              <span className="pdf-page-info">
                Page {pageNumber} of {numPages}
              </span>
              <button onClick={goToNextPage} disabled={pageNumber >= numPages} className="pdf-nav-button">
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="pdf-placeholder">
          Upload a PDF to see its preview.
        </div>
      )}
    </div>
  );
}

export default PdfViewer;
