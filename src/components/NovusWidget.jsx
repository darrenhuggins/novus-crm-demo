import { useState } from 'react';

/* global pendo */

// NOTE: this is a placeholder agent id. Pendo Agent Analytics only rolls
// this up under a named agent once one is actually registered for this
// subscription (the same way the web install snippet needed a real apiKey
// before Novus wired it up) -- until then, trackAgent calls still fire in
// the correct shape, they just won't resolve to a named agent in the UI.
const AGENT_ID = 'novus-crm-demo-agent';

const CANNED_REPLIES = [
  { keywords: ['pipeline', 'opportunit'], reply: "Your pipeline's looking solid — several deals sitting in Proposal and Negotiation. Want me to flag the ones closing this month?" },
  { keywords: ['account'], reply: "A few of your accounts have grown ARR recently. Want a quick rundown of your top accounts by revenue?" },
  { keywords: ['contact'], reply: "You've got a good spread of contacts across your accounts. Want me to flag any that haven't been touched in a while?" },
  { keywords: ['forecast', 'quota'], reply: "You're tracking toward about 65% of quota this period. Want a few ideas on what could move the needle before close?" },
  { keywords: ['help', 'what can you do'], reply: "I can help you navigate accounts, contacts, and opportunities, summarize your pipeline, or just talk through what's on your plate. What do you need?" },
];

const FALLBACK_REPLIES = [
  "Got it — let me know if you'd like me to look anything up for you.",
  "Thanks for that, I'll keep it in mind.",
  "Noted! Anything else I can help with?",
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function getCannedReply(text) {
  const lower = text.toLowerCase();
  const match = CANNED_REPLIES.find(({ keywords }) => keywords.some((k) => lower.includes(k)));
  return match ? match.reply : pick(FALLBACK_REPLIES);
}

function trackAgent(type, payload) {
  if (typeof pendo === 'undefined') return;
  pendo.trackAgent(type, { agentId: AGENT_ID, ...payload });
}

export default function NovusWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [conversationId, setConversationId] = useState(null);

  const send = () => {
    const text = input.trim();
    if (!text || thinking) return;

    const convId = conversationId ?? crypto.randomUUID();
    if (!conversationId) setConversationId(convId);

    const promptId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: promptId, from: 'user', text }]);
    setInput('');
    trackAgent('prompt', { conversationId: convId, messageId: promptId, content: text });

    setThinking(true);
    setTimeout(() => {
      const replyId = crypto.randomUUID();
      const reply = getCannedReply(text);
      setMessages((prev) => [...prev, { id: replyId, from: 'agent', text: reply, reaction: null }]);
      trackAgent('agent_response', { conversationId: convId, messageId: replyId, content: reply });
      setThinking(false);
    }, 700 + Math.random() * 900);
  };

  const react = (messageId, reaction) => {
    const convId = conversationId;
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reaction } : m)));
    trackAgent('user_reaction', { conversationId: convId, messageId, content: reaction });
  };

  return (
    <div className="novus-widget">
      {open && (
        <div className="novus-panel">
          <div className="novus-panel-header">
            <span>Ask Novus</span>
            <button onClick={() => setOpen(false)} aria-label="Close">×</button>
          </div>
          <div className="novus-panel-body">
            <div className="novus-messages">
              {messages.length === 0 && (
                <p className="novus-empty">Ask me about your accounts, contacts, opportunities, or pipeline.</p>
              )}
              {messages.map((m) => (
                <div key={m.id} className={m.from === 'user' ? 'novus-bubble novus-bubble-user' : 'novus-bubble novus-bubble-agent'}>
                  <p>{m.text}</p>
                  {m.from === 'agent' && (
                    <div className="novus-reactions">
                      <button
                        type="button"
                        className={m.reaction === 'positive' ? 'novus-reaction-up active' : 'novus-reaction-up'}
                        onClick={() => react(m.id, 'positive')}
                        aria-label="Good response"
                      >
                        👍
                      </button>
                      <button
                        type="button"
                        className={m.reaction === 'negative' ? 'novus-reaction-down active' : 'novus-reaction-down'}
                        onClick={() => react(m.id, 'negative')}
                        aria-label="Bad response"
                      >
                        👎
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {thinking && <div className="novus-bubble novus-bubble-agent novus-thinking">Novus is typing…</div>}
            </div>
            <form
              className="novus-chat-form"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <input
                className="novus-chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Novus…"
                disabled={thinking}
              />
              <button type="submit" className="novus-chat-send" disabled={thinking || !input.trim()}>
                Send
              </button>
            </form>
          </div>
        </div>
      )}
      <button className="novus-launcher" onClick={() => setOpen((o) => !o)}>
        {open ? 'Close' : 'Ask Novus'}
      </button>
    </div>
  );
}
