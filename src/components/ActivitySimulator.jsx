import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCrmData } from '../context/CrmDataContext';
import { personas } from '../data/personas';
import { stages, contactTitles } from '../data/mockData';

/* global pendo */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default function ActivitySimulator({ open, onClose }) {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const { addContact, addOpportunity } = useCrmData();
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const cursor = useRef(0);

  const appendLog = (line) => setLog((prev) => [...prev, line]);

  const runOneSession = async (persona) => {
    login({ ...persona });
    appendLog(`Logged in as ${persona.name} (${persona.accountName})`);
    await wait(500);

    navigate('/');
    appendLog('Viewed Dashboard');
    await wait(500);

    navigate('/accounts');
    appendLog('Viewed Accounts');
    await wait(500);

    navigate('/contacts');
    appendLog('Viewed Contacts');
    await wait(500);

    navigate('/opportunities');
    appendLog('Viewed Opportunities');
    await wait(500);

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
    await wait(500);

    navigate('/');
    appendLog('Returned to Dashboard');
    await wait(400);

    logout();
    appendLog(`Logged out of ${persona.name}'s session`);
    await wait(300);
  };

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
          <p className="login-subtitle">
            Simulates a real visitor session — logs in, browses every page, creates a
            record, then logs out — so Novus has genuine identified activity to track.
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
