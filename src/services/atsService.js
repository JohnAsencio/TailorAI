import { generateContent } from "../api";
import { parseATSSection } from "../utils/textUtils";

export async function checkATSCompatibility(resumeText, jobDescription) {
  const prompt = `You are an expert ATS (Applicant Tracking System) analyzer. Analyze how well the following resume matches the job description and provide a comprehensive ATS compatibility report.

CRITICAL: Output your response in the following EXACT format (use these exact section headers):
---ATS_SCORE---
[Score as a number from 0-100]
---KEYWORD_MATCH---
[Percentage of job description keywords found in resume]
---MATCHING_KEYWORDS---
[List of keywords from job description that ARE found in the resume, separated by commas]
---MISSING_KEYWORDS---
[List of important keywords from job description that are NOT found in the resume, separated by commas]
---FORMATTING_ISSUES---
[List any ATS formatting issues like: tables, images, complex formatting, etc. If none, say "No major formatting issues detected"]
---RECOMMENDATIONS---
[2-4 specific, actionable recommendations to improve ATS compatibility, each on a new line starting with "- "]
---OVERALL_ASSESSMENT---
[A brief 2-3 sentence summary of the resume's ATS compatibility]

Resume:
${resumeText}

Job Description:
${jobDescription}`;

  const result = await generateContent(prompt);
  
  const atsScore = parseATSSection(result, 'ATS_SCORE');
  const keywordMatch = parseATSSection(result, 'KEYWORD_MATCH');
  const matchingKeywords = parseATSSection(result, 'MATCHING_KEYWORDS');
  const missingKeywords = parseATSSection(result, 'MISSING_KEYWORDS');
  const formattingIssues = parseATSSection(result, 'FORMATTING_ISSUES');
  const recommendations = parseATSSection(result, 'RECOMMENDATIONS');
  const overallAssessment = parseATSSection(result, 'OVERALL_ASSESSMENT');

  return {
    score: atsScore,
    keywordMatch: keywordMatch,
    matchingKeywords: matchingKeywords.split(',').map(k => k.trim()).filter(k => k),
    missingKeywords: missingKeywords.split(',').map(k => k.trim()).filter(k => k),
    formattingIssues: formattingIssues,
    recommendations: recommendations.split('\n').filter(r => r.trim()).map(r => r.replace(/^-\s*/, '')),
    overallAssessment: overallAssessment
  };
}

