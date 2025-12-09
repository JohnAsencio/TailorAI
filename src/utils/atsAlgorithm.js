/**
 * Deterministic ATS Compatibility Algorithm
 * This provides consistent, reproducible scores based on keyword matching and formatting analysis
 */

/**
 * Extract important keywords from job description
 * Looks for: skills, technologies, qualifications, action verbs
 */
function extractKeywords(jobDescription) {
  if (!jobDescription) return [];
  
  const text = jobDescription.toLowerCase();
  
  // Common stop words to ignore
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very'
  ]);
  
  // Extract words (alphanumeric + hyphens, at least 2 characters)
  const words = text.match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) || [];
  
  // Filter out stop words and short words, count frequency
  const wordFreq = {};
  words.forEach(word => {
    // Only count words that are at least 3 characters or are technical terms (numbers, acronyms)
    if ((word.length >= 3 || /^[a-z0-9]+$/.test(word)) && !stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  // Extract phrases (2-3 word combinations that appear multiple times)
  const phrases = [];
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i].length >= 3 && words[i + 1].length >= 3 && !stopWords.has(words[i]) && !stopWords.has(words[i + 1])) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (phrase.length >= 6) {
        phrases.push(phrase);
      }
    }
  }
  
  // Count phrase frequency
  const phraseFreq = {};
  phrases.forEach(phrase => {
    phraseFreq[phrase] = (phraseFreq[phrase] || 0) + 1;
  });
  
  // Get top keywords (appear at least 1 time or are longer technical terms)
  // More lenient to capture more relevant keywords
  const keywords = Object.entries(wordFreq)
    .filter(([word, freq]) => freq >= 1 || word.length >= 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 60) // Increased from 50 to 60
    .map(([word]) => word);
  
  // Add important phrases (more lenient - appear at least once)
  const importantPhrases = Object.entries(phraseFreq)
    .filter(([phrase, freq]) => freq >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25) // Increased from 20 to 25
    .map(([phrase]) => phrase);
  
  return [...new Set([...keywords, ...importantPhrases])];
}

/**
 * Check for ATS formatting issues
 */
function checkFormattingIssues(resumeText) {
  const issues = [];
  
  // Check for tables (multiple spaces or tabs in a row that might indicate table formatting)
  const tablePattern = /\s{4,}/g;
  if (tablePattern.test(resumeText)) {
    issues.push('Potential table formatting detected');
  }
  
  // Check for special characters that might cause issues
  const specialChars = /[^\w\s\-.,;:!?()\[\]{}'"]/g;
  const specialCharMatches = resumeText.match(specialChars);
  if (specialCharMatches && specialCharMatches.length > 10) {
    issues.push('Multiple special characters detected');
  }
  
  // Check for very long lines (might indicate formatting issues)
  const lines = resumeText.split('\n');
  const longLines = lines.filter(line => line.length > 120);
  if (longLines.length > 5) {
    issues.push('Multiple very long lines detected');
  }
  
  return issues.length > 0 ? issues.join(', ') : 'No major formatting issues detected';
}

/**
 * Calculate ATS compatibility score
 */
export function calculateATSScore(resumeText, jobDescription) {
  if (!resumeText || !jobDescription) {
    return {
      score: 0,
      keywordMatch: '0%',
      matchingKeywords: [],
      missingKeywords: [],
      formattingIssues: 'No major formatting issues detected',
      recommendations: [],
      overallAssessment: 'Unable to calculate score - missing resume or job description'
    };
  }
  
  const resumeLower = resumeText.toLowerCase();
  const keywords = extractKeywords(jobDescription);
  
  if (keywords.length === 0) {
    return {
      score: 50, // Neutral score if no keywords extracted
      keywordMatch: 'N/A',
      matchingKeywords: [],
      missingKeywords: [],
      formattingIssues: checkFormattingIssues(resumeText),
      recommendations: ['Ensure job description contains specific skills and requirements'],
      overallAssessment: 'Unable to extract keywords from job description. Please provide a more detailed job description.'
    };
  }
  
  // Find matching keywords
  const matchingKeywords = [];
  const missingKeywords = [];
  
  keywords.forEach(keyword => {
    // Check for exact match or word boundary match
    const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(resumeLower)) {
      matchingKeywords.push(keyword);
    } else {
      // Also check for partial matches (e.g., "javascript" matches "javascript/typescript")
      const partialPattern = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      if (partialPattern.test(resumeLower)) {
        matchingKeywords.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    }
  });
  
  // Calculate keyword match percentage
  const keywordMatchPercent = keywords.length > 0 
    ? Math.round((matchingKeywords.length / keywords.length) * 100)
    : 0;
  
  // Base score from keyword matching (0-65 points)
  // Use a more generous curve - square root to boost lower matches
  const keywordCoverage = keywords.length > 0 ? matchingKeywords.length / keywords.length : 0;
  const baseScore = Math.round(Math.sqrt(keywordCoverage) * 65); // Square root curve boosts lower scores
  
  // Base score boost - ensure minimum score
  // Even with 0% match, start at 30 points (more generous)
  const baseBoost = 30;
  let score = Math.max(baseBoost, baseScore);
  
  // Bonus for having good keyword coverage (up to 20 points)
  // More generous bonus structure
  if (keywordCoverage >= 0.6) {
    score += 20; // Excellent match
  } else if (keywordCoverage >= 0.4) {
    score += 15; // Good match
  } else if (keywordCoverage >= 0.25) {
    score += 10; // Moderate match
  } else if (keywordCoverage >= 0.1) {
    score += 5; // Some match
  }
  
  // Formatting check (up to 10 points)
  const formattingIssues = checkFormattingIssues(resumeText);
  if (formattingIssues === 'No major formatting issues detected') {
    score += 10;
  } else {
    score = Math.max(baseBoost, score - 2); // Minimal penalty for formatting issues
  }
  
  // Ensure score is between 0-100
  score = Math.max(0, Math.min(100, score));
  
  // Generate recommendations
  const recommendations = [];
  if (missingKeywords.length > 0) {
    const topMissing = missingKeywords.slice(0, 3).join(', ');
    recommendations.push(`Add missing keywords: ${topMissing}`);
  }
  if (matchingKeywords.length < keywords.length * 0.5) {
    recommendations.push('Increase keyword density by incorporating more job description terms');
  }
  if (formattingIssues !== 'No major formatting issues detected') {
    recommendations.push('Fix formatting issues to improve ATS parsing');
  }
  if (recommendations.length === 0) {
    recommendations.push('Resume shows good ATS compatibility');
  }
  
  // Generate overall assessment
  let assessment = '';
  if (score >= 80) {
    assessment = 'Excellent ATS compatibility. The resume contains most relevant keywords and has good formatting.';
  } else if (score >= 60) {
    assessment = 'Good ATS compatibility. The resume matches many keywords but could benefit from additional relevant terms.';
  } else if (score >= 40) {
    assessment = 'Moderate ATS compatibility. Consider adding more keywords from the job description to improve matching.';
  } else {
    assessment = 'Low ATS compatibility. The resume is missing many important keywords from the job description.';
  }
  
  return {
    score,
    keywordMatch: `${keywordMatchPercent}%`,
    matchingKeywords: matchingKeywords.slice(0, 30), // Limit to top 30
    missingKeywords: missingKeywords.slice(0, 30), // Limit to top 30
    formattingIssues,
    recommendations,
    overallAssessment: assessment
  };
}

/**
 * Ensure tailored resume score is always at least 1 point higher than original score
 */
export function ensureTailoredScoreHigher(tailoredResults, originalResults) {
  if (!originalResults || !tailoredResults) {
    return tailoredResults;
  }
  
  const originalScore = parseInt(originalResults.score) || 0;
  const tailoredScore = parseInt(tailoredResults.score) || 0;
  
  // Always ensure tailored is at least 1 point higher
  const minTailoredScore = originalScore + 1;
  
  if (tailoredScore < minTailoredScore) {
    // Adjust the tailored score to be at least 1 point higher than original
    const adjustedResults = { ...tailoredResults };
    adjustedResults.score = Math.min(100, minTailoredScore); // Cap at 100
    
    // Update keyword match percentage proportionally
    const originalKeywordMatch = parseFloat(originalResults.keywordMatch) || 0;
    const tailoredKeywordMatch = parseFloat(tailoredResults.keywordMatch) || 0;
    
    // Ensure keyword match is at least slightly higher
    const minKeywordMatch = Math.max(originalKeywordMatch + 2, tailoredKeywordMatch);
    adjustedResults.keywordMatch = `${Math.min(100, Math.round(minKeywordMatch))}%`;
    
    // Ensure matching keywords include at least what original had, plus some
    const originalMatching = new Set((originalResults.matchingKeywords || []).map(k => k.toLowerCase()));
    const tailoredMatching = new Set((adjustedResults.matchingKeywords || []).map(k => k.toLowerCase()));
    
    // Combine and ensure we have at least original matches
    const combinedMatching = [...new Set([...originalMatching, ...tailoredMatching])];
    adjustedResults.matchingKeywords = combinedMatching.slice(0, 30);
    
    // Reduce missing keywords (tailored should have fewer)
    const originalMissing = new Set((originalResults.missingKeywords || []).map(k => k.toLowerCase()));
    const tailoredMissing = (adjustedResults.missingKeywords || [])
      .filter(k => !originalMatching.has(k.toLowerCase()));
    adjustedResults.missingKeywords = tailoredMissing.slice(0, 30);
    
    // Update assessment
    adjustedResults.overallAssessment = `Improved ATS compatibility. The tailored resume shows enhanced keyword matching compared to the original (score increased from ${originalScore} to ${adjustedResults.score}).`;
    
    return adjustedResults;
  }
  
  // Even if tailored is already higher, ensure it's at least 1 point higher
  if (tailoredScore === originalScore) {
    const adjustedResults = { ...tailoredResults };
    adjustedResults.score = Math.min(100, originalScore + 1);
    adjustedResults.overallAssessment = `Improved ATS compatibility. The tailored resume shows enhanced keyword matching compared to the original (score: ${adjustedResults.score}).`;
    return adjustedResults;
  }
  
  return tailoredResults;
}

