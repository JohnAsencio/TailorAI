import '../../App.css';

export default function ATSResults({ results, title, variant }) {
  return (
    <div className={`ats-results-box ats-results-${variant}`}>
      <div className="ats-header">
        <h3 className="ats-heading">{title}</h3>
        <div className={`ats-score-circle ${variant === 'tailored' ? 'ats-score-tailored' : ''}`}>
          <div className="ats-score-number">{results.score}</div>
          <div className="ats-score-label">Score</div>
        </div>
      </div>
      
      <div className="ats-overall-assessment">
        {results.overallAssessment}
      </div>

      <div className="ats-metrics-grid">
        <div className="ats-metric">
          <div className="ats-metric-label">Keyword Match</div>
          <div className="ats-metric-value">{results.keywordMatch}</div>
        </div>
      </div>

      {results.matchingKeywords.length > 0 && (
        <div className="ats-section">
          <h4 className="ats-section-title">
            <span className="material-icons">check_circle</span>
            Matching Keywords
          </h4>
          <div className="ats-keywords-list matching">
            {results.matchingKeywords.map((keyword, idx) => (
              <span key={idx} className="ats-keyword-tag matching">{keyword}</span>
            ))}
          </div>
        </div>
      )}

      {results.missingKeywords.length > 0 && (
        <div className="ats-section">
          <h4 className="ats-section-title">
            <span className="material-icons">warning</span>
            Missing Keywords
          </h4>
          <div className="ats-keywords-list missing">
            {results.missingKeywords.map((keyword, idx) => (
              <span key={idx} className="ats-keyword-tag missing">{keyword}</span>
            ))}
          </div>
        </div>
      )}

      {results.formattingIssues && results.formattingIssues !== "No major formatting issues detected" && (
        <div className="ats-section">
          <h4 className="ats-section-title">
            <span className="material-icons">info</span>
            Formatting Issues
          </h4>
          <div className="ats-formatting-issues">{results.formattingIssues}</div>
        </div>
      )}

      {results.recommendations.length > 0 && (
        <div className="ats-section">
          <h4 className="ats-section-title">
            <span className="material-icons">lightbulb</span>
            Recommendations
          </h4>
          <ul className="ats-recommendations-list">
            {results.recommendations.map((rec, idx) => (
              <li key={idx} className="ats-recommendation-item">{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

