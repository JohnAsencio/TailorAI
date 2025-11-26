import ATSResults from './ATSResults';
import '../../App.css';

export default function ATSComparison({ originalResults, tailoredResults }) {
  return (
    <section className="ats-comparison-section animate-fade-in">
      <h2 className="ats-comparison-heading">ATS Compatibility Comparison</h2>
      <div className="ats-comparison-grid">
        {originalResults && (
          <ATSResults results={originalResults} title="Original Resume" variant="original" />
        )}
        {tailoredResults && (
          <ATSResults results={tailoredResults} title="Tailored Resume" variant="tailored" />
        )}
      </div>
    </section>
  );
}

