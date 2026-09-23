import { createContext, useContext, useRef, useState } from 'react';

const ErrorBannerContext = createContext(null);

export function ErrorBannerProvider({ children }) {
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);

  const showError = (message) => {
    clearTimeout(timeoutRef.current);
    setError({ id: Date.now(), message });
    timeoutRef.current = setTimeout(() => setError(null), 4500);
  };

  const dismissError = () => {
    clearTimeout(timeoutRef.current);
    setError(null);
  };

  return (
    <ErrorBannerContext.Provider value={{ error, showError, dismissError }}>
      {children}
    </ErrorBannerContext.Provider>
  );
}

export function useErrorBanner() {
  const ctx = useContext(ErrorBannerContext);
  if (!ctx) throw new Error('useErrorBanner must be used within an ErrorBannerProvider');
  return ctx;
}
