import { useState } from 'react';

/**
 * Placeholder chat launcher for Pendo Novus.
 * Once Novus is connected to this app, its own launcher/widget will
 * render itself — this stand-in just gives you a click target and a
 * console hook to confirm wiring before that happens.
 */
export default function NovusWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="novus-widget">
      {open && (
        <div className="novus-panel">
          <div className="novus-panel-header">
            <span>Novus</span>
            <button onClick={() => setOpen(false)} aria-label="Close">×</button>
          </div>
          <div className="novus-panel-body">
            <p>Novus isn't connected yet.</p>
            <p>Once wired up, this is where it'll live.</p>
          </div>
        </div>
      )}
      <button className="novus-launcher" onClick={() => setOpen((o) => !o)}>
        {open ? 'Close' : 'Ask Novus'}
      </button>
    </div>
  );
}
