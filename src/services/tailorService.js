import { generateContent } from "../api";
import { cleanMarkdownFormatting } from "../utils/textUtils";

export async function tailorResume(resumeText, jobDescription) {
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
- Do NOT invent or fabricate any experience, education, or personal information.
- Key changes are expected. Your primary goal is to maximize the keyword match score. This includes adding relevant quantified achievements and skills that are implied by the candidate's existing experience but explicitly requested by the Job Description.
- If not too farfetched add skills from the job description to the resume, if it will help the candidate pass ATS systems.
- Preserve all original personal information and structure. DO NOT DELETE EVEN SEMI RELEVANT INFORMATION.
- Output ONLY the improved resume in plain text, ready to use.
- The resume should be formatted in a professional manner, with clear sections and bullet points.
- The header of each section should be in all caps and left-aligned.
- Be sure to add key words from the job description (from the job description and qualifications) to the resume.
- Make the candidate look like a high potential fit for the role.

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

