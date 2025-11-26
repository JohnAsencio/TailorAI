// Initialize PDF.js worker
import * as pdfjsLib from "pdfjs-dist";

export function initializePdfWorker() {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
}

