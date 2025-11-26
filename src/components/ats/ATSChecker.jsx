import '../../App.css';

export default function ATSChecker({
  onCheckOriginal,
  onCheckTailored,
  atsLoading,
  atsCheckingType,
  disabledOriginal,
  disabledTailored,
}) {
  return (
    <section className="ats-buttons-section animate-fade-in">
      <div className="ats-check-buttons-group">
        <button
          onClick={onCheckOriginal}
          className={`ats-check-button ats-check-original ${atsLoading && atsCheckingType === 'original' ? ' loading' : ''}`}
          disabled={(atsLoading && atsCheckingType !== 'original') || disabledOriginal}
          title="Check how well your original resume matches the job description"
        >
          {atsLoading && atsCheckingType === 'original' ? (
            <span className="flex-center-gap">
              <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing...
            </span>
          ) : (
            <span className="flex-center-gap">
              <span className="material-icons">description</span>
              Check Original Resume
            </span>
          )}
        </button>
        <button
          onClick={onCheckTailored}
          className={`ats-check-button ats-check-tailored ${atsLoading && atsCheckingType === 'tailored' ? ' loading' : ''}`}
          disabled={(atsLoading && atsCheckingType !== 'tailored') || disabledTailored}
          title="Check how well your tailored resume matches the job description"
        >
          {atsLoading && atsCheckingType === 'tailored' ? (
            <span className="flex-center-gap">
              <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing...
            </span>
          ) : (
            <span className="flex-center-gap">
              <span className="material-icons">verified</span>
              Check Tailored Resume
            </span>
          )}
        </button>
      </div>
    </section>
  );
}

