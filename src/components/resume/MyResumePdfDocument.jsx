import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    fontFamily: 'Times-Roman',
    backgroundColor: '#fff',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  section: {
    marginBottom: 10,
  },
  header: {
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  bold: { fontWeight: 'bold' },
  italics: { fontStyle: 'italic' },
  bullet: {
    marginLeft: 10,
    marginBottom: 2,
  },
  orgDateLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  normalText: {
    marginBottom: 2,
  }
});

// Helper function to clean any remaining Markdown
const cleanMarkdown = (text) => {
  if (!text) return text;
  // Remove bold/italic: **text** __text__ *text* _text_
  let cleaned = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, '$2');
  // Remove headings: # ## ###
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  // Remove code: `text`
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  return cleaned;
};

const isAllCaps = (text) => text && /^[A-Z\s]+$/.test(text.trim());
const isBullet = (line) => line && /^[-•*]\s+/.test(line.trim());
const hasNumbers = (text) => text && /\d/.test(text);

const MyResumePdfDocument = ({ resumeText }) => {
  if (!resumeText || !resumeText.trim()) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>No resume data provided.</Text>
        </Page>
      </Document>
    );
  }

  // Clean the entire resume text first
  const cleanedResumeText = cleanMarkdown(resumeText);

  const lines = cleanedResumeText
    .split(/\r?\n/)
    .map((line) => line.replace(/^\uFEFF/, '').replace(/[^\x20-\x7E]+/g, '').trim())
    .filter((line) => line !== '');

  const name = lines[0];
  const rest = lines.slice(1);

  const renderedSections = [];
  let sectionContent = [];
  let currentSectionTitle = null;

  for (let i = 0; i < rest.length; i++) {
    const line = rest[i];

    // Section header (e.g., EXPERIENCE, EDUCATION)
    if (isAllCaps(line) && !hasNumbers(line)) {
      if (sectionContent.length > 0) {
        renderedSections.push(
          <View key={`section-${renderedSections.length}`} style={styles.section}>
            {sectionContent}
          </View>
        );
        sectionContent = [];
      }
      currentSectionTitle = line;
      sectionContent.push(
        <Text key={`header-${i}`} style={styles.header}>
          {line}
        </Text>
      );
      continue;
    }

    // Bullet line
    if (isBullet(line)) {
      sectionContent.push(
        <Text key={`bullet-${i}`} style={styles.bullet}>
          • {line.replace(/^[-•*]\s+/, '')}
        </Text>
      );
      continue;
    }
    if (currentSectionTitle === 'EDUCATION') {
      const nextLine = rest[i + 1] || '';
      const eduTypeDateMatch = nextLine.match(/(.+?)\s*[-–]\s*(\b\d{4}\s*[-–]\s*(?:\d{4}|Present)\b)/i);

      if (eduTypeDateMatch && !isBullet(nextLine)) {
        const educationType = eduTypeDateMatch[1].trim();
        const date = eduTypeDateMatch[2].trim();

        sectionContent.push(
          <Text key={`university-name-${i}`} style={styles.bold}>
            {line}
          </Text>
        );
        sectionContent.push(
          <View key={`education-type-date-${i}`} style={styles.orgDateLine}>
            <Text style={styles.italics}>{educationType}</Text>
            <Text style={styles.italics}>{date}</Text>
          </View>
        );
        i++;
        continue;
      }
      sectionContent.push(
        <Text key={`education-text-${i}`} style={styles.normalText}>
          {line}
        </Text>
      );
      continue;
    }

    // Projects Section Formatting
    if (currentSectionTitle === 'PROJECTS') {
      if (isBullet(rest[i + 1])) {
        sectionContent.push(
          <Text key={`project-title-${i}`} style={styles.bold}>
            {line}
          </Text>
        );
      } else {
        sectionContent.push(
          <Text key={`project-desc-fallback-${i}`} style={styles.normalText}>
            {line}
          </Text>
        );
      }
      continue;
    }

    // Skills Section Formatting
    if (currentSectionTitle === 'SKILLS' || currentSectionTitle === 'TECHNICAL SKILLS') {
      sectionContent.push(
        <Text key={`skill-${i}`} style={styles.bold}>
          {line}
        </Text>
      );
      continue;
    }

    // Experience Section Formatting
    if (currentSectionTitle === 'EXPERIENCE' || currentSectionTitle === 'PROFESSIONAL EXPERIENCE') {
      const nextLine = rest[i + 1] || '';
      const orgDateMatch = nextLine.match(/(.+?)\s*[-–]\s*(\b\d{4}\s*[-–]\s*(?:\d{4}|Present)\b)/i);

      if (orgDateMatch && !isBullet(nextLine)) {
        const companyName = orgDateMatch[1].trim();
        const date = orgDateMatch[2].trim();

        sectionContent.push(
          <Text key={`job-title-${i}`} style={styles.bold}>
            {line}
          </Text>
        );
        sectionContent.push(
          <View key={`job-org-date-${i}`} style={styles.orgDateLine}>
            <Text style={styles.italics}>{companyName}</Text>
            <Text style={styles.italics}>{date}</Text>
          </View>
        );
        i++;
        continue;
      }
      sectionContent.push(
        <Text key={`experience-text-${i}`} style={styles.normalText}>
          {line}
        </Text>
      );
      continue;
    }


    // Default fallback for any lines not caught by specific section logic
    sectionContent.push(
      <Text key={`fallback-${i}`} style={styles.normalText}>
        {line}
      </Text>
    );
  }

  // Push the final section
  if (sectionContent.length > 0) {
    renderedSections.push(
      <View key="final-section" style={styles.section}>
        {sectionContent}
      </View>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.name}>{name}</Text>
          {renderedSections}
        </View>
      </Page>
    </Document>
  );
};

export default MyResumePdfDocument;