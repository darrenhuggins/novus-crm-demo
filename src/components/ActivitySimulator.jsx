import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { personas } from '../data/personas';
import { industries, stages, contactTitles } from '../data/mockData';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const between = (min, max) => wait(min + Math.random() * (max - min));

function formatDuration(ms) {
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return sec ? `${min}m ${sec}s` : `${min}m`;
}

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

// Sets a value the way a real keystroke/selection would, so React's
// controlled-input tracking actually fires onChange (a plain `el.value =`
// gets silently swallowed because React patches the DOM setter to track
// the "real" value already).
function setReactValue(el, value) {
  const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
}

function getModalField(labelText) {
  for (const label of document.querySelectorAll('.modal-form label')) {
    if (label.textContent.trim().startsWith(labelText)) {
      return label.querySelector('input, select');
    }
  }
  return null;
}

const MODES = [
  { id: 'happy', label: 'Realistic Session' },
  { id: 'frustrated', label: 'Frustrated Session' },
];

const PACING = {
  quick: { label: 'Quick (10–30s between visitors)', range: [10_000, 30_000] },
  hour: { label: 'Spread over ~1 hour', range: [3 * 60_000, 8 * 60_000] },
  day: { label: 'Spread over most of a day', range: [20 * 60_000, 60 * 60_000] },
};

export default function ActivitySimulator({ open, onClose }) {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [mode, setMode] = useState('happy');
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(10);
  const [pacing, setPacing] = useState('quick');
  const [queueStatus, setQueueStatus] = useState(null);
  const cursor = useRef(0);
  const stopRef = useRef(false);

  const appendLog = (line) => setLog((prev) => [...prev, line]);

  // Drives the real "+ Add New" button, tab, and form fields — not a
  // shortcut through context state — so Pendo's feature tagging (which
  // watches the actual button/tab/field elements, not a custom track
  // call) attributes this the same way it would a genuine user action.
  const createRecordViaRealForm = async (type, persona) => {
    const addBtn = document.querySelector('.add-new-btn');
    if (!addBtn) {
      appendLog('Could not find the Add New button — skipped record creation');
      return;
    }
    addBtn.click();
    await between(500, 900);

    const tabLabel = type === 'contact' ? 'Contact' : type === 'account' ? 'Account' : 'Opportunity';
    const tab = [...document.querySelectorAll('.modal-tab')].find((t) => t.textContent.trim() === tabLabel);
    if (tab) tab.click();
    await between(300, 500);

    const nameField = getModalField('Name');
    if (nameField) setReactValue(nameField, type === 'contact' ? `${persona.name} (colleague)` : `${persona.accountName} Expansion`);
    await between(300, 500);

    const accountField = getModalField('Account');
    if (accountField) setReactValue(accountField, persona.accountName);
    await between(300, 500);

    if (type === 'account') {
      const industryField = getModalField('Industry');
      if (industryField) setReactValue(industryField, pick(industries));
      await between(250, 400);
      const employeesField = getModalField('Employees');
      if (employeesField) setReactValue(employeesField, String(50 + Math.floor(Math.random() * 950)));
      await between(250, 400);
      const arrField = getModalField('ARR');
      if (arrField) setReactValue(arrField, String(10000 + Math.floor(Math.random() * 90000)));
    } else if (type === 'contact') {
      const titleField = getModalField('Title');
      if (titleField) setReactValue(titleField, pick(contactTitles));
      await between(250, 400);

      const emailField = getModalField('Email');
      if (emailField) setReactValue(emailField, persona.email);
    } else {
      const stageField = getModalField('Stage');
      if (stageField) setReactValue(stageField, pick(stages));
      await between(250, 400);

      const amountField = getModalField('Amount');
      if (amountField) setReactValue(amountField, String(5000 + Math.floor(Math.random() * 60000)));
    }
    await between(500, 900);

    const submitBtn = document.querySelector('.modal-form button[type="submit"]');
    if (submitBtn) {
      submitBtn.click();
      appendLog(`Filled out and submitted the Add New form for ${type === 'account' ? 'an account' : type === 'contact' ? 'a contact' : 'an opportunity'} at ${persona.accountName}`);
    } else {
      appendLog('Could not find the Save button — form was not submitted');
    }
    await between(300, 600);
  };

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

    const r = Math.random();
    const type = r < 0.33 ? 'account' : r < 0.66 ? 'contact' : 'opportunity';
    if (type === 'account') {
      navigate('/accounts');
      appendLog('Navigated to Accounts to add a new one');
      await between(800, 1200);
    } else if (type === 'contact') {
      navigate('/contacts');
      appendLog('Navigated back to Contacts to add a new one');
      await between(800, 1200);
    }
    await createRecordViaRealForm(type, persona);

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

  const stopLongRun = () => {
    stopRef.current = true;
  };

  const runLongQueue = async () => {
    setRunning(true);
    stopRef.current = false;
    setQueueStatus({ completed: 0, total: sessionCount });

    for (let i = 0; i < sessionCount; i++) {
      if (stopRef.current) {
        appendLog(`Long run stopped after ${i} of ${sessionCount} visitors.`);
        break;
      }

      await runOneSession(pick(personas));
      setQueueStatus({ completed: i + 1, total: sessionCount });

      if (stopRef.current) {
        appendLog(`Long run stopped after ${i + 1} of ${sessionCount} visitors.`);
        break;
      }

      if (i < sessionCount - 1) {
        const [min, max] = PACING[pacing].range;
        const gapMs = min + Math.random() * (max - min);
        appendLog(`Pausing ~${formatDuration(gapMs)} before the next visitor…`);
        await wait(gapMs);
      }
    }

    setRunning(false);
    setQueueStatus(null);
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
              ? 'Simulates a real visitor session with human-paced delays — logs in, browses every page, then creates a record through the real Add New button/tabs/fields so Pendo attributes it correctly, then logs out.'
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

          <div className="longrun-panel">
            <div className="login-divider">or shape traffic over a longer stretch</div>

            <div className="longrun-fields">
              <label>
                Visitors
                <input
                  type="number"
                  min="2"
                  max="200"
                  value={sessionCount}
                  onChange={(e) => setSessionCount(Math.max(2, Math.min(200, Number(e.target.value) || 2)))}
                  disabled={running}
                />
              </label>
              <label>
                Pacing
                <select value={pacing} onChange={(e) => setPacing(e.target.value)} disabled={running}>
                  {Object.entries(PACING).map(([id, p]) => (
                    <option key={id} value={id}>{p.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
              <button type="button" className="btn-primary" onClick={runLongQueue} disabled={running}>
                Start Long Run
              </button>
              <button type="button" className="btn-secondary" onClick={stopLongRun} disabled={!queueStatus}>
                Stop
              </button>
            </div>

            {queueStatus && (
              <p className="substat" style={{ marginTop: 8 }}>
                Visitor {queueStatus.completed} of {queueStatus.total} completed. Keep this tab open — a closed
                or backgrounded tab may delay timers, but the run will pick back up.
              </p>
            )}
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
