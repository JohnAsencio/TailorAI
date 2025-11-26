# File Structure Refactoring

## New Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginPage.jsx & .css
│   │   └── ProfilePage.jsx & .css
│   ├── layout/
│   │   ├── Header.jsx & .css
│   │   ├── Navigation.jsx & .css
│   │   ├── ProfileButton.jsx
│   │   └── ThemeToggle.jsx & .css
│   ├── resume/
│   │   ├── TailorPage.jsx (NEW - main resume tailoring view)
│   │   ├── ResumeDisplay.jsx (moved)
│   │   ├── PdfViewer.jsx (moved)
│   │   └── MyResumePdfDocument.jsx (moved)
│   ├── ats/
│   │   ├── ATSChecker.jsx (NEW)
│   │   ├── ATSComparison.jsx (NEW)
│   │   └── ATSResults.jsx (NEW)
│   ├── common/
│   │   └── MockPage.jsx & .css
│   └── index.js (exports all components)
├── hooks/
│   ├── useTheme.js (extracted theme logic)
│   └── useAuth.js (extracted auth logic)
├── utils/
│   ├── textUtils.js (cleanMarkdownFormatting, parseATSSection)
│   └── pdfUtils.js (PDF worker initialization)
├── services/
│   ├── resumeService.js (PDF/DOCX extraction)
│   ├── atsService.js (ATS checking logic)
│   └── tailorService.js (resume tailoring logic)
└── App.jsx (simplified to ~70 lines - just routing!)
```
