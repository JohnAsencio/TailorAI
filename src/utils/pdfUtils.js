// Initialize PDF.js worker
import * as pdfjsLib from "pdfjs-dist";

export function initializePdfWorker() {
  // Use worker from public folder (which includes Safari polyfill)
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
}

