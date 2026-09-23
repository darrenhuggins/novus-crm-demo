import { createContext, useContext, useState } from 'react';
import { useCrmData } from './CrmDataContext';

/* global pendo */
const AuthContext = createContext(null);
const AUTH_KEY = 'novuscrm_auth_user';

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const { accounts, addAccount } = useCrmData();
  const [user, setUser] = useState(readStoredUser);

  const login = ({ name, email, role, accountName, isNewAccount }) => {
    let account = accounts.find((a) => a.name === accountName);
    if (isNewAccount && !account) {
      account = { name: accountName, industry: 'Technology', employees: 0, arr: 0 };
      addAccount(account);
    }
    if (!account) return;

    const authedUser = {
      name,
      email,
      role,
      accountName: account.name,
      visitorId: `visitor-${slugify(email)}`,
      accountId: `account-${slugify(account.name)}`,
    };

    localStorage.setItem(AUTH_KEY, JSON.stringify(authedUser));
    setUser(authedUser);

    if (typeof pendo !== 'undefined') {
      pendo.identify({
        visitor: { id: authedUser.visitorId, email, full_name: name, role },
        account: { id: authedUser.accountId, name: account.name },
      });
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
    // Deliberately not re-identifying to a fresh anonymous visitor here:
    // doing that on every logout minted a brand-new random visitor id with
    // no full_name/email, which Pendo could only display as a raw UUID,
    // while still inheriting the outgoing account (since that identify
    // call didn't set one either). The next login() call re-identifies
    // properly moments later; nothing meaningful happens on the login
    // screen in between.
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
