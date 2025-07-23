import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Times-Roman', backgroundColor: '#fff' },
  header: { fontWeight: 'bold', fontSize: 12, marginBottom: 4, textTransform: 'uppercase' },
  line: { marginBottom: 2 },
});

const MyResumePdfDocument = ({ resumeText }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View>
        {resumeText && resumeText.trim()
          ? resumeText.trim().split(/\r?\n/).filter(line => line.trim() !== "").map((line, idx) =>
              /^[A-Z\s]+$/.test(line.trim()) ? (
                <Text key={idx} style={styles.header}>{line}</Text>
              ) : (
                <Text key={idx} style={styles.line}>{line}</Text>
              )
            )
          : <Text>No resume data provided.</Text>
        }
      </View>
    </Page>
  </Document>
);

export default MyResumePdfDocument;