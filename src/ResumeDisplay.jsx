import React from 'react';
import { diffWords } from 'diff';
import './ResumeDisplay.css'; // NEW

function HighlightedResumeDisplay({ originalText, tailoredText, displayMode }) {
  let contentToDisplay;

  if (displayMode === 'empty') {
    contentToDisplay = (
      <div className="highlighted-empty">
        Your resume will appear here after upload.
      </div>
    );
  } else if (displayMode === 'original') {
    contentToDisplay = (
      <pre className="highlighted-original">
        {originalText}
      </pre>
    );
  } else if (displayMode === 'tailored_highlighted') {
    const changes = diffWords(originalText, tailoredText);

    contentToDisplay = (
      <div className="highlighted-tailored">
        <p className="highlighted-legend">
          <span className="legend-added"></span> Added
          <span className="legend-removed"></span> Removed
        </p>
        {changes.map((part, index) => {
          const className = part.added
            ? 'text-added'
            : part.removed
            ? 'text-removed'
            : 'text-unchanged';

          const content = part.value.split('\n').map((line, lineIndex) => (
            <React.Fragment key={`${index}-${lineIndex}`}>
              {line}
              {lineIndex < part.value.split('\n').length - 1 && <br />}
            </React.Fragment>
          ));

          return (
            <span key={index} className={className}>
              {content}
            </span>
          );
        })}
      </div>
    );
  } else {
    contentToDisplay = (
      <div className="highlighted-fallback">
        No content to display.
      </div>
    );
  }

  return (
    <div className="highlighted-container">
      {contentToDisplay}
    </div>
  );
}

export default HighlightedResumeDisplay;
