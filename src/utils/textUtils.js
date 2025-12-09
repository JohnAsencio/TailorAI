// Utility function to clean Markdown formatting from text and ensure proper formatting
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
  
  // Remove any remaining markdown-like patterns
  cleaned = cleaned.replace(/<[^>]+>/g, ''); // Remove HTML tags if any
  cleaned = cleaned.replace(/\*\s+/g, '- '); // Convert * bullets to - bullets
  cleaned = cleaned.replace(/^\s*[•]\s+/gm, '- '); // Convert • bullets to - bullets
  
  // Fix multiple spaces
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  
  // Fix multiple newlines (max 2 consecutive)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Ensure section headers are properly formatted (ALL CAPS, on their own line)
  cleaned = cleaned.replace(/^([A-Z][A-Z\s&]+)$/gm, (match) => {
    // If it's already all caps and looks like a section header, keep it
    if (match === match.toUpperCase() && match.length > 2 && match.length < 30) {
      return match;
    }
    return match;
  });
  
  // Remove any text that's accidentally all caps (except section headers)
  const lines = cleaned.split('\n');
  const processedLines = lines.map((line, index) => {
    const trimmed = line.trim();
    // Skip if it's a section header (all caps, short, on its own line)
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 2 && trimmed.length < 30 && 
        (index === 0 || lines[index - 1].trim() === '')) {
      return line;
    }
    // If a line is all caps and long, convert to title case (likely formatting error)
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 30 && /^[A-Z\s]+$/.test(trimmed)) {
      return trimmed.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    }
    return line;
  });
  
  cleaned = processedLines.join('\n');
  
  // Trim and clean up
  cleaned = cleaned.trim();
  
  return cleaned;
}

// Parse ATS section from AI response
export function parseATSSection(text, sectionName) {
  const regex = new RegExp(`---${sectionName}---\\s*([\\s\\S]*?)(?=---|$)`);
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

