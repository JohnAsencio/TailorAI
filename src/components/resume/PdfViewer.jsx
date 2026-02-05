import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css'; // Required for annotations
import 'react-pdf/dist/Page/TextLayer.css'; // Required for text layer

// Set workerSrc for react-pdf.
// Using worker from public folder (which includes Safari polyfill)
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

function PdfViewer({ pdfFileUrl, hidePagination = false }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loadingError, setLoadingError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1); // Reset to first page on new document load
    setLoadingError(null); // Clear any previous errors
    setIsLoading(false);
  }

  function onDocumentLoadError(error) {
    console.error("Error loading PDF document:", error);
    setIsLoading(false);
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

  // Reset loading state when pdfFileUrl changes
  useEffect(() => {
    if (pdfFileUrl) {
      setIsLoading(true);
    }
  }, [pdfFileUrl]);

  const loadingComponent = (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '400px' 
    }}>
      <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ height: '1.25rem', width: '1.25rem', color: 'var(--accent, #4a6fa5)', animation: 'spin 1s linear infinite' }}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

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
            loading={loadingComponent}
          >
            <Page
              pageNumber={pageNumber}
              renderTextLayer={true} // Enable text layer for selection/copy
              renderAnnotationLayer={true} // Enable annotation layer
              className="pdf-page"
            />
          </Document>
          {numPages && !hidePagination && numPages > 1 && (
            <div className="pdf-navigation">
              <button 
                type="button"
                onClick={goToPrevPage} 
                disabled={pageNumber <= 1} 
                className="pdf-nav-button"
                style={{ cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <span className="pdf-page-info">
                Page {pageNumber} of {numPages}
              </span>
              <button 
                type="button"
                onClick={goToNextPage} 
                disabled={pageNumber >= numPages} 
                className="pdf-nav-button"
                style={{ cursor: pageNumber >= numPages ? 'not-allowed' : 'pointer' }}
              >
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
