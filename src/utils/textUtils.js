// Utility function to clean Markdown formatting from text
export function cleanMarkdownFormatting(text) {
  if (!text) return text;
  
  // Remove bold/italic markdown: **text** or __text__ or *text* or _text_
  let cleaned = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, '$2');
  
  // Remove heading markers: # ## ###
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  
  // Remove inline code: `text`
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  
  // Remove links: [text](url) -> text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  return cleaned;
}

// Parse ATS section from AI response
export function parseATSSection(text, sectionName) {
  const regex = new RegExp(`---${sectionName}---\\s*([\\s\\S]*?)(?=---|$)`);
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

