import { calculateATSScore } from "../utils/atsAlgorithm";

/**
 * Check ATS compatibility using deterministic algorithm
 * This provides consistent, reproducible results
 */
export async function checkATSCompatibility(resumeText, jobDescription) {
  // Use deterministic algorithm instead of AI for consistent results
  return calculateATSScore(resumeText, jobDescription);
}

