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
  lineWithDate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 2,
  },
  jobRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  // New style for job/education organization + date line
  orgDateLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
});

const isAllCaps = (text) => /^[A-Z\s]+$/.test(text.trim());
const isBullet = (line) => /^[-•*]\s+/.test(line.trim()); // Added '*' for bullet
const isDateLine = (text) => /\b\d{4}\s*[-–]\s*(?:\d{4}|Present)\b/i.test(text.trim());
const hasNumbers = (text) => /\d/.test(text);

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

  const lines = resumeText
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

    // Projects Section Formatting
    if (currentSectionTitle === 'PROJECTS') {
      // If the next line is a bullet, this line is a project title
      if (isBullet(rest[i + 1])) {
        sectionContent.push(
          <Text key={`project-title-${i}`} style={styles.bold}>
            {line}
          </Text>
        );
      } else {
        // Fallback for non-bulleted lines in projects, though ideally all descriptions are bulleted
        sectionContent.push(
          <Text key={`project-desc-fallback-${i}`}>
            {line}
          </Text>
        );
      }
      continue;
    }

    // Skills Section Formatting
    if (currentSectionTitle === 'SKILLS') {
      // Assuming each line in SKILLS is a skill title to be bolded
      sectionContent.push(
        <Text key={`skill-${i}`} style={styles.bold}>
          {line}
        </Text>
      );
      continue;
    }

    // Experience Section Formatting
    if (currentSectionTitle === 'EXPERIENCE') {
      const nextLine = rest[i + 1] || '';

      // Check for Job Title followed by Company Name - Date
      // This assumes the job title is followed by a line containing "Company Name - Date"
      const orgDateMatch = nextLine.match(/(.+?)\s*[-–]\s*(\b\d{4}\s*[-–]\s*(?:\d{4}|Present)\b)/i);

      if (orgDateMatch && !isBullet(nextLine)) {
        const companyName = orgDateMatch[1].trim();
        const date = orgDateMatch[2].trim();

        sectionContent.push(
          <Text key={`job-title-${i}`} style={styles.bold}>
            {line} {/* This is the Job Title */}
          </Text>
        );
        sectionContent.push(
          <View key={`job-org-date-${i}`} style={styles.orgDateLine}>
            <Text style={styles.italics}>{companyName}</Text>
            <Text style={styles.italics}>{date}</Text>
          </View>
        );
        i++; // Skip the next line as it's already consumed
        continue;
      }
      // If it's not a job title/company line, it's likely a description (which should ideally be bulleted)
      // For any other lines that might appear, just render them normally as a fallback.
      sectionContent.push(
        <Text key={`experience-text-${i}`}>
          {line}
        </Text>
      );
      continue;
    }

    // Education Section Formatting
    if (currentSectionTitle === 'EDUCATION') {
      const nextLine = rest[i + 1] || '';

      // Check for University Name followed by Education Type - Date
      const eduTypeDateMatch = nextLine.match(/(.+?)\s*[-–]\s*(\b\d{4}\s*[-–]\s*(?:\d{4}|Present)\b)/i);

      if (eduTypeDateMatch && !isBullet(nextLine)) {
        const educationType = eduTypeDateMatch[1].trim();
        const date = eduTypeDateMatch[2].trim();

        sectionContent.push(
          <Text key={`university-name-${i}`} style={styles.bold}>
            {line} {/* This is the University Name */}
          </Text>
        );
        sectionContent.push(
          <View key={`education-type-date-${i}`} style={styles.orgDateLine}>
            <Text style={styles.italics}>{educationType}</Text>
            <Text style={styles.italics}>{date}</Text>
          </View>
        );
        i++; // Skip the next line as it's already consumed
        continue;
      }
      // For any other lines that might appear, just render them normally as a fallback.
      sectionContent.push(
        <Text key={`education-text-${i}`}>
          {line}
        </Text>
      );
      continue;
    }

    // Default fallback for any lines not caught by specific section logic
    sectionContent.push(
      <Text key={`fallback-${i}`}>
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