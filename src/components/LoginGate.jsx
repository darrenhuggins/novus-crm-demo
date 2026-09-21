import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCrmData } from '../context/CrmDataContext';
import { personas } from '../data/personas';

export default function LoginGate({ onRunSimulator }) {
  const { login } = useAuth();
  const { accounts } = useCrmData();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [accountName, setAccountName] = useState(accounts[0]?.name ?? '');
  const [isNewAccount, setIsNewAccount] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !accountName) return;
    login({ name, email, role, accountName, isNewAccount });
  };

  return (
    <div className="login-gate">
      <div className="login-card">
        <div className="brand" style={{ marginBottom: 8 }}>novusCRM</div>
        <p className="login-subtitle">Log in to identify this session with Pendo/Novus.</p>

        <div className="login-personas">
          {personas.map((p) => (
            <button
              key={p.email}
              type="button"
              className="persona-chip"
              onClick={() => login({ ...p })}
            >
              {p.name} <span>· {p.accountName}</span>
            </button>
          ))}
        </div>

        <div className="login-divider">or log in manually</div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Role
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. VP of Sales" />
          </label>
          <label>
            Company
            <select
              value={isNewAccount ? '__new__' : accountName}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  setIsNewAccount(true);
                  setAccountName('');
                } else {
                  setIsNewAccount(false);
                  setAccountName(e.target.value);
                }
              }}
            >
              {accounts.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
              <option value="__new__">+ New company…</option>
            </select>
          </label>
          {isNewAccount && (
            <label>
              New company name
              <input value={accountName} onChange={(e) => setAccountName(e.target.value)} required />
            </label>
          )}

          <div className="modal-actions">
            <button type="submit" className="btn-primary">Log in</button>
          </div>
        </form>

        <button type="button" className="btn-secondary simulate-link" onClick={onRunSimulator}>
          Or run a simulated session instead →
        </button>
      </div>
    </div>
  );
}
