import { useBooleanFlagValue } from '@openfeature/react-sdk';

export default function HelpButton() {
  const showHelp = useBooleanFlagValue('helpButtonEnabled', false);

  if (!showHelp) return null;

  return (
    <button
      className="help-btn"
      onClick={() => alert('Help centre coming soon!')}
      title="Get help"
    >
      ? Help
    </button>
  );
}
