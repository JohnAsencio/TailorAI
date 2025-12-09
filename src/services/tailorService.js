import { generateContent } from "../api";
import { cleanMarkdownFormatting } from "../utils/textUtils";

export async function tailorResume(resumeText, jobDescription, allowExpansion = false, additionalContext = "") {
  const expansionInstructions = allowExpansion 
    ? `- CRITICAL PRIORITY - MAXIMUM KEYWORD INTEGRATION: You MUST aggressively identify and ADD ALL important keywords, skills, technologies, tools, and qualifications from the job description that are missing from the resume. This is your TOP priority.
- STRONG EXPANSION REQUIRED: You MUST add 2-4 new bullet points per relevant work experience that incorporate missing keywords from the job description. Make these additions believable and contextually appropriate - they should sound like natural extensions of the candidate's existing experience.
- SKILLS SECTION EXPANSION: You MUST add ALL relevant skills, technologies, frameworks, tools, and methodologies mentioned in the job description to the SKILLS section, even if they weren't in the original resume. Group them logically (e.g., "Languages: Python, JavaScript, Java" or "Tools: Docker, Kubernetes, AWS").
- KEYWORD DENSITY: Strategically weave missing keywords throughout EVERY section - in bullet points, skills sections, experience descriptions, and project descriptions. Aim for high keyword density while maintaining readability.
- QUANTIFIED ACHIEVEMENTS: Add quantified achievements, metrics, and responsibilities that incorporate job description keywords. These should be believable extensions that align with the candidate's background (e.g., if they worked with databases, adding "optimized database queries" is reasonable).
- NATURAL INTEGRATION: When adding keywords, integrate them naturally into existing bullet points OR add new bullet points. Make sure additions flow naturally and don't sound forced or out of place.
- CRITICAL: Keep the resume to ONE PAGE. Be concise and prioritize the most impactful content. If adding content would exceed one page, remove less relevant bullet points or consolidate information, but prioritize adding keywords over keeping old content.`
    : `- Do NOT invent or fabricate any experience, education, or personal information.
- Only add keywords and skills that are implied by the candidate's existing experience.
- Do NOT add new bullet points or experiences that aren't already suggested by the original resume content.
- Focus on rephrasing and optimizing existing content rather than adding new content.
- CRITICAL: Keep the resume to ONE PAGE. Maintain concise formatting and remove any unnecessary content.`;

  const prompt = `You are an expert resume editor. Your job is to tailor the following resume to better fit the provided job description and be able to pass ATS systems.
This system is geared for technical roles, but may be used for other sectors. For technical roles make sure the candidate looks like a high potential candidate for role.
For SWE roles, focus on results, and turn personal projects into real business value statements. 

CRITICAL FORMATTING RULES - FOLLOW EXACTLY (VIOLATIONS WILL CAUSE FORMATTING ERRORS):
- Output ONLY plain text with NO special formatting characters whatsoever
- DO NOT use asterisks (*), underscores (_), hash symbols (#), or any markdown syntax
- DO NOT use Markdown, HTML, LaTeX, or any markup language syntax
- DO NOT use bold, italic, or any text styling - everything must be plain text
- Use ALL CAPS for section headers ONLY (e.g., EXPERIENCE, EDUCATION, SKILLS) - nothing else should be all caps
- Use simple bullets with a hyphen and space (- ) for bullet points - NO other bullet styles
- Keep all text as plain text without any formatting symbols
- Do not wrap anything in special characters or formatting symbols
- Ensure proper line breaks between sections
- Each section header should be on its own line, followed by a blank line
- Contact information at the top should be on separate lines (name, email, phone, LinkedIn)

Instructions:
${expansionInstructions}
- Key changes are expected. Your primary goal is to maximize the keyword match score.
${allowExpansion ? '- IMPORTANT: When expansion mode is enabled, you MUST actively add missing keywords from the job description. Scan the job description for all important terms, skills, technologies, and qualifications, and ensure they appear in the tailored resume. This is a top priority.' : ''}
- Preserve all original personal information and structure. DO NOT DELETE EVEN SEMI RELEVANT INFORMATION.
- Output ONLY the improved resume in plain text, ready to use.
- The resume should be formatted in a professional manner, with clear sections and bullet points.
- The header of each section should be in all caps and left-aligned.
- Be sure to add key words from the job description (from the job description and qualifications) to the resume.
- Make the candidate look like a high potential fit for the role.
- PAGE LENGTH CONSTRAINT: The final resume MUST fit on ONE PAGE (approximately 500-700 words total). Use concise language, combine similar bullet points when possible, and prioritize the most relevant and impactful content. Count your words - if approaching 700 words, be more aggressive about removing less relevant content. Prioritize keyword-rich content over verbose descriptions.
- QUALITY ASSURANCE: Before outputting, verify:
  * No markdown formatting (asterisks, underscores, hash symbols, backticks, etc.)
  * No all-caps text except section headers
  * Proper line breaks and spacing
  * All bullet points use "- " format
  * Contact info is properly formatted at the top
  * Total word count is under 700 words
  * Resume is ready to use immediately without further editing

--- SECTION SELECTION GUIDELINES ---
- Prioritize sections based on direct relevance to the job description.
- NEVER include a separate CONTACT section. Contact information should always be part of the resume top header (name, email, phone, LinkedIn, etc.).
- For technical or professional roles: Focus on sections like PROFESSIONAL EXPERIENCE, PROJECTS, TECHNICAL SKILLS, EDUCATION, CERTIFICATIONS (if relevant).
    - Only include INTERESTS or AWARDS sections if they directly demonstrate highly relevant skills or achievements for this specific role if not scrap it.
    - If a SKILLS section is included, ensure it emphasizes abilities directly applicable to the job (e.g., programming languages, software tools for tech roles; customer service, teamwork for service roles) and includes keywords to pass ATS systems.
- For customer-facing or service roles (e.g., fast food, retail): Sections like relevant experience, customer service skills, teamwork, and transferable soft skills are more important. INTERESTS or AWARDS may be included if they showcase relevant soft skills or dedication.
- For other sectors do the same thing. Only apply sections that are relevant to the job description.
- Only include sections from the original resume that are truly beneficial for the target job, but do not leave out too much such that the word count is significantly reduced.
-------------------------------------

Resume:
${resumeText}

Job Description:
${jobDescription}
${additionalContext ? `

--- ADDITIONAL USER CONTEXT/INSTRUCTIONS ---
${additionalContext}
Please carefully consider and incorporate these specific instructions or corrections into the tailored resume.
--- END ADDITIONAL CONTEXT ---
` : ''}

After the resume, add a section titled "Summary of Changes:" and list 2-4 bullet points summarizing the key changes you made. Separate the summary from the resume with the line:
---SUMMARY OF CHANGES---
`;

  const result = await generateContent(prompt);
  const [tailoredResume, summary] = result.split("---SUMMARY OF CHANGES---");
  
  // Clean any Markdown formatting that might have slipped through
  let cleanedResume = cleanMarkdownFormatting(tailoredResume.trim());
  
  // Additional quality checks and fixes
  cleanedResume = validateAndFixResumeFormat(cleanedResume);
  
  const cleanedSummary = summary ? summary.trim() : "";
  
  return {
    tailoredResume: cleanedResume,
    summary: cleanedSummary
  };
}

/**
 * Validate and fix resume formatting to ensure it's ready to use
 */
function validateAndFixResumeFormat(resumeText) {
  if (!resumeText) return resumeText;
  
  let fixed = resumeText;
  
  // Remove any remaining markdown artifacts
  fixed = fixed.replace(/\*\*/g, '');
  fixed = fixed.replace(/__/g, '');
  fixed = fixed.replace(/`/g, '');
  fixed = fixed.replace(/#{1,6}\s*/g, '');
  
  // Ensure proper bullet format (standardize to "- ")
  fixed = fixed.replace(/^[\s]*[•*]\s+/gm, '- ');
  fixed = fixed.replace(/^[\s]*-\s*$/gm, ''); // Remove empty bullet lines
  
  // Fix section headers - ensure they're ALL CAPS and on their own line
  const commonSections = ['experience', 'education', 'skills', 'projects', 'certifications', 'awards', 'summary', 'objective'];
  commonSections.forEach(section => {
    const regex = new RegExp(`^\\s*${section}\\s*$`, 'gmi');
    fixed = fixed.replace(regex, section.toUpperCase());
  });
  
  // Remove excessive blank lines (max 2 consecutive)
  fixed = fixed.replace(/\n{3,}/g, '\n\n');
  
  // Check for all-bold text issues (lines that are all caps and too long)
  const lines = fixed.split('\n');
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    // If a line is all caps, long, and not a section header, it might be accidentally bold
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 50 && 
        !/^(EXPERIENCE|EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS|AWARDS|SUMMARY|OBJECTIVE|CONTACT)$/.test(trimmed)) {
      // Convert to title case
      return trimmed.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    }
    return line;
  });
  fixed = processedLines.join('\n');
  
  // Ensure contact info formatting (name should be first, prominent)
  const finalLines = fixed.split('\n');
  if (finalLines.length > 0) {
    // If first line looks like a name (has capital letters, not all caps, reasonable length)
    const firstLine = finalLines[0].trim();
    if (firstLine && firstLine.length < 50 && /^[A-Z]/.test(firstLine) && firstLine !== firstLine.toUpperCase()) {
      // Good - likely a name
    } else if (firstLine && firstLine.length > 0) {
      // Might need fixing, but don't auto-fix as it could be wrong
    }
  }
  
  // Remove any lines that are just formatting characters
  fixed = fixed.split('\n')
    .filter(line => line.trim().length > 0 || line === '') // Keep blank lines for spacing
    .join('\n');
  
  // Word count check - warn if too long (but don't truncate, let user know)
  const wordCount = fixed.split(/\s+/).filter(word => word.length > 0).length;
  if (wordCount > 750) {
    console.warn(`Resume word count (${wordCount}) exceeds recommended one-page limit (~700 words). Consider condensing.`);
  }
  
  // Final trim
  fixed = fixed.trim();
  
  return fixed;
}

