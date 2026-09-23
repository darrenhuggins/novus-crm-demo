import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useErrorBanner } from '../context/ErrorBannerContext';
import { personas } from '../data/personas';
import { industries, stages, contactTitles } from '../data/mockData';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const between = (min, max) => wait(min + Math.random() * (max - min));

// --- Simulated cursor -------------------------------------------------
// A real visible pointer that moves across the screen and dispatches real
// mousemove/mousedown/mouseup/click events with proper coordinates, so
// session replay shows natural-looking movement instead of instant,
// coordinate-less DOM events.
let cursorPos = { x: -100, y: -100 };

function ensureSimCursor() {
  let el = document.getElementById('sim-cursor');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sim-cursor';
    el.className = 'sim-cursor';
    document.body.appendChild(el);
  }
  return el;
}

function showSimCursor() {
  ensureSimCursor().style.opacity = '1';
}

function hideSimCursor() {
  const el = document.getElementById('sim-cursor');
  if (el) el.style.opacity = '0';
}

async function moveCursorTo(x, y) {
  const el = ensureSimCursor();
  el.style.opacity = '1';
  const startX = cursorPos.x < 0 ? x : cursorPos.x;
  const startY = cursorPos.y < 0 ? y : cursorPos.y;
  const steps = 16;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const curX = startX + (x - startX) * eased;
    const curY = startY + (y - startY) * eased;
    el.style.transform = `translate(${curX}px, ${curY}px)`;
    document.elementFromPoint(curX, curY)?.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: curX, clientY: curY })
    );
    await wait(10 + Math.random() * 12);
  }
  cursorPos = { x, y };
}

async function clickWithCursor(el) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  if (!rect.width && !rect.height) return false;
  const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * Math.min(6, rect.width / 4);
  const y = rect.top + rect.height / 2 + (Math.random() - 0.5) * Math.min(6, rect.height / 4);
  await moveCursorTo(x, y);
  await wait(60 + Math.random() * 120);
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: x, clientY: y }));
  await wait(30 + Math.random() * 60);
  el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: x, clientY: y }));
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
  return true;
}

// Repeated clicks near the same spot (small jitter each time) for rage
// clicks, with real cursor movement to get there first.
async function rageClickCursor(selector, times, gapMs) {
  const el = document.querySelector(selector);
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  if (!rect.width && !rect.height) return false;
  const baseX = rect.left + rect.width / 2;
  const baseY = rect.top + rect.height / 2;
  await moveCursorTo(baseX, baseY);
  for (let i = 0; i < times; i++) {
    const jx = baseX + (Math.random() - 0.5) * 6;
    const jy = baseY + (Math.random() - 0.5) * 6;
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: jx, clientY: jy }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: jx, clientY: jy }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: jx, clientY: jy }));
    await wait(gapMs + Math.random() * 80);
  }
  return true;
}

async function clickNavLink(label) {
  const link = [...document.querySelectorAll('.nav-link')].find((a) => a.textContent.trim() === label);
  if (!link) return false;
  return clickWithCursor(link);
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

// Clicks into a text field, then builds up the value character by
// character (each partial string is a real "keystroke" event) instead
// of setting the whole value in one shot, so data entry is watchable.
async function typeIntoField(el, text) {
  if (!el) return false;
  await clickWithCursor(el);
  el.focus();
  for (let i = 1; i <= text.length; i++) {
    setReactValue(el, text.slice(0, i));
    await wait(35 + Math.random() * 90);
  }
  return true;
}

// Clicks a <select>, pauses as if choosing, then picks the value.
async function selectWithCursor(el, value) {
  if (!el) return false;
  await clickWithCursor(el);
  await between(200, 400);
  setReactValue(el, value);
  await between(150, 300);
  return true;
}

function getModalField(labelText) {
  for (const label of document.querySelectorAll('.modal-form label')) {
    if (label.textContent.trim().startsWith(labelText)) {
      return label.querySelector('input, select');
    }
  }
  return null;
}

// --- Simulated errors ---------------------------------------------------
// A grab-bag of failure modes real apps actually produce, so simulated
// sessions occasionally hit an error the way a genuine user would — good
// material for session replay and error-monitoring demos. `logConsole`
// throws-and-catches a real Error so a proper stack trace lands in the
// console, without actually crashing anything.
const ERROR_TYPES = [
  {
    banner: 'Something went wrong — the account could not be created.',
    logConsole: () => new Error('POST /api/accounts failed: constraint violation on accounts.id'),
  },
  {
    banner: 'Database write failed. Your changes may not be saved.',
    logConsole: () => new Error('DatabaseError: write failed — connection pool exhausted'),
  },
  {
    banner: 'Server error (500) — request could not be completed.',
    logConsole: () => new Error('Internal Server Error: POST /api/records 500'),
  },
  {
    banner: 'Not Found (404) — the requested resource is unavailable.',
    logConsole: () => new Error('Not Found: GET /api/accounts/undefined 404'),
  },
  {
    banner: 'An unexpected error occurred. Please try again.',
    logConsole: () => new RangeError('Maximum call stack size exceeded'),
  },
  {
    banner: 'Request timed out. Please check your connection.',
    logConsole: () => new Error('TimeoutError: request exceeded 30000ms'),
  },
];

function triggerRandomError(showError, chance) {
  if (Math.random() > chance) return false;
  const errorType = pick(ERROR_TYPES);
  showError(errorType.banner);
  console.error(errorType.logConsole());
  return errorType.banner;
}

function formatDuration(ms) {
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return sec ? `${min}m ${sec}s` : `${min}m`;
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

const NOVUS_QUESTIONS = [
  "How's my pipeline looking?",
  'Any accounts I should focus on?',
  "What's my forecast attainment?",
  'Any contacts I should follow up with?',
  'What can you help me with?',
];

// Rapid-fire follow-ups for a "rage prompt" burst: a visitor who feels
// unheard and re-prompts instead of waiting, escalating rather than
// rephrasing calmly.
const NOVUS_RAGE_FOLLOWUPS = [
  "That's not what I asked.",
  'Can you actually answer my question?',
  "This isn't helping at all.",
  'Just give me a straight answer.',
  'Forget it, never mind.',
];

export default function ActivitySimulator({ open, onClose }) {
  const { login, logout } = useAuth();
  const { showError } = useErrorBanner();
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
    await clickWithCursor(addBtn);
    await between(500, 900);

    const tabLabel = type === 'contact' ? 'Contact' : type === 'account' ? 'Account' : 'Opportunity';
    const tab = [...document.querySelectorAll('.modal-tab')].find((t) => t.textContent.trim() === tabLabel);
    if (tab) await clickWithCursor(tab);
    await between(300, 500);

    const nameField = getModalField('Name');
    if (nameField) await typeIntoField(nameField, type === 'contact' ? `${persona.name} (colleague)` : `${persona.accountName} Expansion`);
    await between(300, 500);

    const accountField = getModalField('Account');
    if (accountField) await selectWithCursor(accountField, persona.accountName);
    await between(300, 500);

    if (type === 'account') {
      const industryField = getModalField('Industry');
      if (industryField) await selectWithCursor(industryField, pick(industries));
      await between(250, 400);
      const employeesField = getModalField('Employees');
      if (employeesField) await typeIntoField(employeesField, String(50 + Math.floor(Math.random() * 950)));
      await between(250, 400);
      const arrField = getModalField('ARR');
      if (arrField) await typeIntoField(arrField, String(10000 + Math.floor(Math.random() * 90000)));
    } else if (type === 'contact') {
      const titleField = getModalField('Title');
      if (titleField) await selectWithCursor(titleField, pick(contactTitles));
      await between(250, 400);

      const emailField = getModalField('Email');
      if (emailField) await typeIntoField(emailField, persona.email);
    } else {
      const stageField = getModalField('Stage');
      if (stageField) await selectWithCursor(stageField, pick(stages));
      await between(250, 400);

      const amountField = getModalField('Amount');
      if (amountField) await typeIntoField(amountField, String(5000 + Math.floor(Math.random() * 60000)));
    }
    await between(500, 900);

    const failure = triggerRandomError(showError, 0.15);
    if (failure) {
      appendLog(`⚠️ Clicked Save, but hit an error: ${failure}`);
      await between(800, 1400);
      const cancelBtn = [...document.querySelectorAll('.modal-form button')].find((b) => b.textContent.trim() === 'Cancel');
      if (cancelBtn) await clickWithCursor(cancelBtn);
      await between(300, 600);
      return;
    }

    const submitBtn = document.querySelector('.modal-form button[type="submit"]');
    if (submitBtn) {
      await clickWithCursor(submitBtn);
      appendLog(`Filled out and submitted the Add New form for ${type === 'account' ? 'an account' : type === 'contact' ? 'a contact' : 'an opportunity'} at ${persona.accountName}`);
    } else {
      appendLog('Could not find the Save button — form was not submitted');
    }
    await between(300, 600);
  };

  const viewPage = async (label) => {
    await clickNavLink(label);
    appendLog(`Viewed ${label}`);
    const failure = triggerRandomError(showError, 0.06);
    if (failure) appendLog(`⚠️ ${failure}`);
    await between(1500, 3000);
    await maybeAskNovus(0.15, 0.2);
  };

  // Drives the real "Ask Novus" launcher, input, send button, and
  // reaction buttons -- same philosophy as createRecordViaRealForm --
  // so Pendo Agent Analytics gets genuine prompt/agent_response/
  // user_reaction events tied to real UI interaction.
  //
  // `rage`: instead of one calm question, fires 2-3 rapid-fire prompts
  // (barely waiting for a response before re-prompting, escalating in
  // tone) and finishes with a thumbs-down -- the agent-analytics
  // equivalent of a rage click.
  const chatWithNovus = async (rage = false) => {
    const launcher = document.querySelector('.novus-launcher');
    if (!launcher) return false;
    await clickWithCursor(launcher);
    await between(500, 900);

    const turnCount = rage ? 2 + Math.floor(Math.random() * 2) : 1;
    for (let turn = 0; turn < turnCount; turn++) {
      const input = document.querySelector('.novus-chat-input');
      if (!input) break;
      const question = turn === 0 ? pick(NOVUS_QUESTIONS) : pick(NOVUS_RAGE_FOLLOWUPS);
      await typeIntoField(input, question);
      await between(rage ? 100 : 300, rage ? 300 : 600);

      const sendBtn = document.querySelector('.novus-chat-send');
      if (sendBtn) await clickWithCursor(sendBtn);
      appendLog(rage && turn > 0 ? `Rage-prompted Novus: "${question}"` : `Asked Novus: "${question}"`);
      await between(rage ? 500 : 1400, rage ? 1000 : 2200);
    }

    if (rage || Math.random() < 0.7) {
      const selector = rage ? '.novus-reaction-down' : (Math.random() < 0.8 ? '.novus-reaction-up' : '.novus-reaction-down');
      const buttons = document.querySelectorAll(selector);
      const btn = buttons[buttons.length - 1];
      if (btn) {
        await clickWithCursor(btn);
        appendLog(selector === '.novus-reaction-up' ? "Reacted 👍 to Novus's answer" : "Reacted 👎 to Novus's answer");
      }
      await between(300, 600);
    }

    const closeBtn = document.querySelector('.novus-launcher');
    if (closeBtn) await clickWithCursor(closeBtn);
    await between(300, 600);
    return true;
  };

  // Rolls the dice on whether this is a moment to pop open Ask Novus,
  // and if so, whether it escalates into a rage-prompt burst.
  const maybeAskNovus = async (chatChance, rageChance) => {
    if (Math.random() > chatChance) return;
    await chatWithNovus(Math.random() < rageChance);
  };

  const runHappySession = async (persona) => {
    login({ ...persona });
    appendLog(`Logged in as ${persona.name} (${persona.accountName})`);
    await between(1200, 2000);
    showSimCursor();

    await viewPage('Dashboard');
    await viewPage('Accounts');
    await viewPage('Contacts');
    await viewPage('Opportunities');

    const r = Math.random();
    const type = r < 0.33 ? 'account' : r < 0.66 ? 'contact' : 'opportunity';
    if (type === 'account') {
      await clickNavLink('Accounts');
      appendLog('Navigated to Accounts to add a new one');
      await between(800, 1200);
    } else if (type === 'contact') {
      await clickNavLink('Contacts');
      appendLog('Navigated back to Contacts to add a new one');
      await between(800, 1200);
    }
    await createRecordViaRealForm(type, persona);

    await clickNavLink('Dashboard');
    appendLog('Returned to Dashboard');
    await between(800, 1400);
    await maybeAskNovus(0.15, 0.2);

    logout();
    appendLog(`Logged out of ${persona.name}'s session`);
    hideSimCursor();
    await between(300, 600);
  };

  // A visitor who can't find what they're looking for: clicks things that
  // look actionable but aren't (a logo, a status pill, a heading), stalls
  // on a page, then bounces without finishing anything.
  const runFrustratedSession = async (persona) => {
    login({ ...persona });
    appendLog(`Logged in as ${persona.name} (${persona.accountName})`);
    await between(1000, 1600);
    showSimCursor();

    await clickNavLink('Dashboard');
    appendLog('Viewed Dashboard');
    await between(800, 1400);

    const clickedLogo = await rageClickCursor('.brand', 5, 160);
    appendLog(clickedLogo ? 'Rage-clicked the logo expecting it to do something (dead click)' : 'Skipped logo click — not found');
    const logoFailure = triggerRandomError(showError, 0.2);
    if (logoFailure) appendLog(`⚠️ ${logoFailure}`);
    await between(600, 1000);

    await clickNavLink('Opportunities');
    appendLog('Viewed Opportunities');
    await between(1200, 2000);

    const clickedBadge = await rageClickCursor('.badge', 4, 200);
    appendLog(clickedBadge ? 'Rage-clicked a stage badge expecting a filter (dead click)' : 'Skipped badge click — not found');
    const badgeFailure = triggerRandomError(showError, 0.2);
    if (badgeFailure) appendLog(`⚠️ ${badgeFailure}`);
    await between(3000, 5000);
    appendLog('Paused a while, seemingly unsure what to do next');
    await maybeAskNovus(0.3, 0.6);

    await clickNavLink('Accounts');
    appendLog('Viewed Accounts');
    await between(800, 1300);

    const clickedHeading = await rageClickCursor('.page h1', 3, 220);
    appendLog(clickedHeading ? 'Rage-clicked the page heading, no response (dead click)' : 'Skipped heading click — not found');
    const headingFailure = triggerRandomError(showError, 0.2);
    if (headingFailure) appendLog(`⚠️ ${headingFailure}`);
    await between(700, 1200);
    await maybeAskNovus(0.25, 0.6);

    await clickNavLink('Dashboard');
    appendLog('Bounced back to Dashboard without completing anything');
    await between(500, 900);

    logout();
    appendLog(`Logged out of ${persona.name}'s frustrated session`);
    hideSimCursor();
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

  return (
    <div className={open ? 'simulator-widget' : 'simulator-widget simulator-widget-hidden'}>
      <div className="simulator-panel">
        <div className="modal-header">
          <h3>Activity Simulator</h3>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
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
              ? 'Drives the real UI with a visible cursor and real clicks/typing — logs in, browses every page, then creates a record through the actual Add New button/tabs/fields, then logs out. Occasionally hits a simulated error, and occasionally pops open Ask Novus mid-session with a question (rarely escalating into a rage-prompt burst) for realistic session replay and agent-analytics material.'
              : 'Simulates a struggling visitor — real cursor movement onto things that look actionable but aren’t, so Pendo’s dead-click / rage-click detection picks them up, occasionally compounded by a simulated error or a rage-prompt burst at Ask Novus, then bounces without completing anything.'}
          </p>

          <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
            <button type="button" className="btn-primary" onClick={runSingleSession} disabled={running}>
              Run 1 Session
            </button>
            <button type="button" className="btn-secondary" onClick={runFullTour} disabled={running}>
              Run All {personas.length}
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
                Visitor {queueStatus.completed} of {queueStatus.total} completed. You can hide this panel —
                the run keeps going in the background either way.
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
