import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCrmData } from '../context/CrmDataContext';
import { personas } from '../data/personas';
import { stages, contactTitles } from '../data/mockData';

/* global pendo */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const between = (min, max) => wait(min + Math.random() * (max - min));

// Dispatches real click events on a DOM node that has no click handler, so
// Pendo's own dead-click/rage-click detection (which watches raw clicks,
// not a custom track event) picks them up the same way it would for an
// actual frustrated user.
async function rageClick(selector, times, gapMs) {
  const el = document.querySelector(selector);
  if (!el) return false;
  for (let i = 0; i < times; i++) {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    await wait(gapMs + Math.random() * 80);
  }
  return true;
}

const MODES = [
  { id: 'happy', label: 'Realistic Session' },
  { id: 'frustrated', label: 'Frustrated Session' },
];

export default function ActivitySimulator({ open, onClose }) {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const { addContact, addOpportunity } = useCrmData();
  const [mode, setMode] = useState('happy');
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const cursor = useRef(0);

  const appendLog = (line) => setLog((prev) => [...prev, line]);

  const runHappySession = async (persona) => {
    login({ ...persona });
    appendLog(`Logged in as ${persona.name} (${persona.accountName})`);
    await between(1200, 2000);

    navigate('/');
    appendLog('Viewed Dashboard');
    await between(1500, 3000);

    navigate('/accounts');
    appendLog('Viewed Accounts');
    await between(1500, 3000);

    navigate('/contacts');
    appendLog('Viewed Contacts');
    await between(1500, 3000);

    navigate('/opportunities');
    appendLog('Viewed Opportunities');
    await between(1500, 3000);

    await between(400, 900);
    if (Math.random() > 0.5) {
      const title = pick(contactTitles);
      addContact({ name: `${persona.name} (colleague)`, title, account: persona.accountName, email: persona.email });
      if (typeof pendo !== 'undefined') {
        pendo.track('contact_created', { title, account: persona.accountName, source: 'simulator' });
      }
      appendLog(`Created a contact at ${persona.accountName}`);
    } else {
      const stage = pick(stages);
      const amount = 5000 + Math.floor(Math.random() * 60000);
      addOpportunity({ name: `${persona.accountName} Expansion`, account: persona.accountName, stage, amount, closeDate: '' });
      if (typeof pendo !== 'undefined') {
        pendo.track('opportunity_created', { stage, amount, account: persona.accountName, source: 'simulator' });
      }
      appendLog(`Created an opportunity for ${persona.accountName}`);
    }
    await between(1000, 1800);

    navigate('/');
    appendLog('Returned to Dashboard');
    await between(800, 1400);

    logout();
    appendLog(`Logged out of ${persona.name}'s session`);
    await between(300, 600);
  };

  // A visitor who can't find what they're looking for: clicks things that
  // look actionable but aren't (a logo, a status pill, a heading), stalls
  // on a page, then bounces without finishing anything.
  const runFrustratedSession = async (persona) => {
    login({ ...persona });
    appendLog(`Logged in as ${persona.name} (${persona.accountName})`);
    await between(1000, 1600);

    navigate('/');
    appendLog('Viewed Dashboard');
    await between(800, 1400);

    const clickedLogo = await rageClick('.brand', 5, 160);
    appendLog(clickedLogo ? 'Rage-clicked the logo expecting it to do something (dead click)' : 'Skipped logo click — not found');
    await between(600, 1000);

    navigate('/opportunities');
    appendLog('Viewed Opportunities');
    await between(1200, 2000);

    const clickedBadge = await rageClick('.badge', 4, 200);
    appendLog(clickedBadge ? 'Rage-clicked a stage badge expecting a filter (dead click)' : 'Skipped badge click — not found');
    await between(3000, 5000);
    appendLog('Paused a while, seemingly unsure what to do next');

    navigate('/accounts');
    appendLog('Viewed Accounts');
    await between(800, 1300);

    const clickedHeading = await rageClick('.page h1', 3, 220);
    appendLog(clickedHeading ? 'Rage-clicked the page heading, no response (dead click)' : 'Skipped heading click — not found');
    await between(700, 1200);

    navigate('/');
    appendLog('Bounced back to Dashboard without completing anything');
    await between(500, 900);

    logout();
    appendLog(`Logged out of ${persona.name}'s frustrated session`);
    await between(300, 600);
  };

  const runOneSession = mode === 'frustrated' ? runFrustratedSession : runHappySession;

  const runSingleSession = async () => {
    setRunning(true);
    const persona = personas[cursor.current % personas.length];
    cursor.current += 1;
    await runOneSession(persona);
    setRunning(false);
  };

  const runFullTour = async () => {
    setRunning(true);
    for (const persona of personas) {
      await runOneSession(persona);
    }
    setRunning(false);
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={running ? undefined : onClose}>
      <div className="modal simulator-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Activity Simulator</h3>
          <button type="button" onClick={onClose} disabled={running} aria-label="Close">×</button>
        </div>

        <div className="modal-form">
          <div className="modal-tabs">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={m.id === mode ? 'modal-tab active' : 'modal-tab'}
                onClick={() => setMode(m.id)}
                disabled={running}
              >
                {m.label}
              </button>
            ))}
          </div>

          <p className="login-subtitle">
            {mode === 'happy'
              ? 'Simulates a real visitor session with human-paced delays — logs in, browses every page, creates a record, then logs out.'
              : 'Simulates a struggling visitor — real clicks on things that look actionable but aren’t, so Pendo’s dead-click / rage-click detection picks them up, then bounces without completing anything.'}
          </p>

          <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
            <button type="button" className="btn-primary" onClick={runSingleSession} disabled={running}>
              Run 1 Session
            </button>
            <button type="button" className="btn-secondary" onClick={runFullTour} disabled={running}>
              Run All {personas.length} Personas
            </button>
          </div>

          <div className="simulator-log">
            {log.length === 0 && <p className="substat">Nothing run yet.</p>}
            {log.map((line, i) => <p key={i}>{line}</p>)}
          </div>
        </div>
      </div>
    </div>
  );
}
