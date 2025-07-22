import React from "react";

function parseSections(text) {
  // Split by section headings (all caps, bold, left-aligned)
  const sectionRegex = /^(SUMMARY|SKILLS|EDUCATION|PROFESSIONAL EXPERIENCE|PROJECTS|CERTIFICATIONS|CONTACT|PROFILE|OBJECTIVE|ADDITIONAL|AWARDS|LANGUAGES|INTERESTS)\s*:?$/im;
  const lines = text.split(/\n/);
  let name = "";
  let contact = "";
  let links = "";
  let idx = 0;
  // Parse name, contact, links (first 3 non-empty lines)
  while (idx < lines.length && !name) { if (lines[idx].trim()) name = lines[idx].trim(); idx++; }
  while (idx < lines.length && !contact) { if (lines[idx].trim()) contact = lines[idx].trim(); idx++; }
  while (idx < lines.length && !links) { if (lines[idx].trim()) links = lines[idx].trim(); idx++; }
  // Parse sections
  const sections = [];
  let current = { heading: null, content: [] };
  for (; idx < lines.length; idx++) {
    const line = lines[idx];
    if (sectionRegex.test(line.trim())) {
      if (current.heading || current.content.length) sections.push(current);
      current = { heading: line.trim(), content: [] };
    } else {
      current.content.push(line);
    }
  }
  if (current.heading || current.content.length) sections.push(current);
  return { name, contact, links, sections };
}

const sectionHeadingClass = "text-lg font-bold uppercase text-black mb-1 mt-5 tracking-wide";
const bulletClass = "ml-6 list-disc text-[15px]";
const subBulletClass = "ml-10 list-circle text-[15px]";

function ResumeTemplate({ resumeText }) {
  const { name, contact, links, sections } = parseSections(resumeText);
  return (
    <div style={{ fontFamily: 'Times New Roman, Times, serif', fontSize: 15, color: '#222', maxWidth: 820, margin: '0 auto' }}>
      {/* Name */}
      {name && <div className="text-2xl font-extrabold text-center" style={{ fontSize: 28, marginBottom: 2 }}>{name}</div>}
      {/* Contact */}
      {contact && <div className="text-center text-[15px] font-medium" style={{ marginBottom: 2 }}>{contact}</div>}
      {/* Links */}
      {links && <div className="text-center text-[15px] text-blue-700 underline mb-4" style={{ marginBottom: 12 }}>{links}</div>}
      {/* Sections */}
      {sections.map((section, idx) => (
        <div key={idx}>
          {section.heading && <div className={sectionHeadingClass}>{section.heading.replace(/:$/, "")}</div>}
          <div className="pl-1">
            {section.content.map((line, i) => {
              // Bullet points
              if (/^\s*[-*]\s+/.test(line)) {
                // Sub-bullet
                if (/^\s{2,}[-*]\s+/.test(line)) {
                  return <li key={i} className={subBulletClass}>{line.replace(/^\s*[-*]\s+/, "")}</li>;
                }
                return <li key={i} className={bulletClass}>{line.replace(/^\s*[-*]\s+/, "")}</li>;
              }
              // Paragraph
              if (line.trim()) {
                return <div key={i} className="mb-1 text-[15px]">{line}</div>;
              }
              return null;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ResumeTemplate; 