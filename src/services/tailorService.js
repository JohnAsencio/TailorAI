import { generateContent } from "../api";
import { cleanMarkdownFormatting } from "../utils/textUtils";

export async function tailorResume(resumeText, jobDescription, allowExpansion = false, additionalContext = "") {
  const expansionInstructions = allowExpansion 
    ? `- CRITICAL PRIORITY: Actively identify and ADD keywords from the job description that are missing from the resume. Extract all important keywords, skills, technologies, and qualifications from the job description and ensure they appear in the resume.
- You MUST add new bullet points to existing experiences that incorporate missing keywords from the job description, making them believable and contextually appropriate based on the candidate's background.
- You MUST add relevant skills, technologies, or tools mentioned in the job description to the SKILLS section, even if they weren't explicitly in the original resume.
- Focus on maximizing keyword match by strategically weaving missing keywords throughout the resume - in bullet points, skills sections, and experience descriptions.
- Add quantified achievements or responsibilities that incorporate job description keywords and could reasonably be part of the candidate's experience, as long as they align with their existing background.
- When adding keywords, integrate them naturally into existing bullet points or add new bullet points that make sense for the role.
- CRITICAL: Keep the resume to ONE PAGE. Be concise and prioritize the most impactful content. If adding content would exceed one page, prioritize quality over quantity and remove less relevant bullet points or consolidate information.`
    : `- Do NOT invent or fabricate any experience, education, or personal information.
- Only add keywords and skills that are implied by the candidate's existing experience.
- Do NOT add new bullet points or experiences that aren't already suggested by the original resume content.
- Focus on rephrasing and optimizing existing content rather than adding new content.
- CRITICAL: Keep the resume to ONE PAGE. Maintain concise formatting and remove any unnecessary content.`;

  const prompt = `You are an expert resume editor. Your job is to tailor the following resume to better fit the provided job description and be able to pass ATS systems.
This system is geared for technical roles, but may be used for other sectors. For technical roles make sure the candidate looks like a high potential candidate for role.
For SWE roles, focus on results, and turn personal projects into real business value statements. 

CRITICAL FORMATTING RULES - FOLLOW EXACTLY:
- Output ONLY plain text with NO special formatting characters whatsoever
- DO NOT use asterisks (*), underscores (_), or hash symbols (#) for any formatting
- DO NOT use Markdown, HTML, LaTeX, or any markup language syntax
- Use ALL CAPS for section headers only (e.g., EXPERIENCE, EDUCATION, SKILLS)
- Use simple bullets with a hyphen and space (- ) for bullet points
- Keep all text as plain text without any bold, italic, code blocks, or other markup
- Do not wrap anything in special characters or formatting symbols

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
- PAGE LENGTH CONSTRAINT: The final resume MUST fit on ONE PAGE. Use concise language, combine similar bullet points when possible, and prioritize the most relevant and impactful content. If you must choose between adding new content and staying within one page, prioritize staying within one page while still maximizing keyword relevance.

--- SECTION SELECTION GUIDELINES ---
- **Prioritize sections based on direct relevance to the job description.**
- **NEVER include a separate 'CONTACT' section.** Contact information should always be part of the resume's top header (name, email, phone, LinkedIn, etc.).
- For **technical or professional roles**: Focus on sections like PROFESSIONAL EXPERIENCE, PROJECTS, TECHNICAL SKILLS, EDUCATION, CERTIFICATIONS (if relevant).
    - Only include 'INTERESTS' or 'AWARDS' sections if they directly demonstrate highly relevant skills or achievements for this specific role if not scrap it.
    - If a 'SKILLS' section is included, ensure it emphasizes abilities directly applicable to the job (e.g., programming languages, software tools for tech roles; customer service, teamwork for service roles) and includes keywords to pass ATS systems.
- For **customer-facing or service roles (e.g., fast food, retail)**: Sections like relevant experience, customer service skills, teamwork, and transferable soft skills are more important. 'INTERESTS' or 'AWARDS' may be included if they showcase relevant soft skills or dedication.
- For other sectors do the same thing. Only apply sections that are relevant to the job description.
- Only include sections from the original resume that are truly beneficial for the target job, but don't leave out too much such that the word count is significantly reduced.
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
  const cleanedResume = cleanMarkdownFormatting(tailoredResume.trim());
  const cleanedSummary = summary ? summary.trim() : "";
  
  return {
    tailoredResume: cleanedResume,
    summary: cleanedSummary
  };
}

