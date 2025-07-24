import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 12, fontSize: 10, fontFamily: 'Times-Roman', backgroundColor: '#fff' }, // Reduced padding
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    alignSelf: 'flex-start',
  }, // Name style
  header: { fontWeight: 'bold', fontSize: 12, marginBottom: 4, textTransform: 'uppercase' },
  line: { marginBottom: 2 },
});

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

  // Remove BOM and non-printable characters from every line
  const lines = resumeText
    .split(/\r?\n/)
    .map(line => line.replace(/^\uFEFF/, '').replace(/[^\x20-\x7E]+/g, '').trim())
    .filter(line => line !== "");
  const name = lines[0];
  const rest = lines.slice(1);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={{ alignItems: 'flex-start' }}>
          <Text style={styles.name}>{name}</Text>
          {rest.map((line, idx) =>
            /^[A-Z\s]+$/.test(line.trim()) ? (
              <Text key={idx} style={styles.header}>{line}</Text>
            ) : (
              <Text key={idx} style={styles.line}>{line}</Text>
            )
          )}
        </View>
      </Page>
    </Document>
  );
};

export default MyResumePdfDocument;