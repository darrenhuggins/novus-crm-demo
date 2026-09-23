import { useErrorBanner } from '../context/ErrorBannerContext';

export default function ErrorBanner() {
  const { error, dismissError } = useErrorBanner();

  if (!error) return null;

  return (
    <div className="error-banner" role="alert">
      <span className="error-banner-icon">!</span>
      <span className="error-banner-message">{error.message}</span>
      <button type="button" className="error-banner-dismiss" onClick={dismissError} aria-label="Dismiss">×</button>
    </div>
  );
}
