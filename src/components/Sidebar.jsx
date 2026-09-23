import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import AddNewModal from './AddNewModal';
import { useAuth } from '../context/AuthContext';

/* global __APP_VERSION__ */

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/accounts', label: 'Accounts' },
  { to: '/contacts', label: 'Contacts' },
  { to: '/opportunities', label: 'Opportunities' },
];

const typeForPath = {
  '/accounts': 'Account',
  '/contacts': 'Contact',
  '/opportunities': 'Opportunity',
};

export default function Sidebar({ onOpenSimulator }) {
  const [modalOpen, setModalOpen] = useState(false);
  const location = useLocation();
  const defaultType = typeForPath[location.pathname] ?? 'Opportunity';
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="brand">
        <svg className="brand-flag" viewBox="0 0 48 48" aria-hidden="true">
          <rect width="48" height="48" rx="10" fill="#e10600" />
          <g fill="#fff">
            <rect x="10" y="10" width="7" height="7" />
            <rect x="24" y="10" width="7" height="7" />
            <rect x="17" y="17" width="7" height="7" />
            <rect x="31" y="17" width="7" height="7" />
            <rect x="10" y="24" width="7" height="7" />
            <rect x="24" y="24" width="7" height="7" />
            <rect x="17" y="31" width="7" height="7" />
            <rect x="31" y="31" width="7" height="7" />
          </g>
        </svg>
        novusCRM
      </div>
      <nav>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            end={link.to === '/'}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="add-new-btn" onClick={() => setModalOpen(true)}>+ Add New</button>
        <button className="simulate-btn" onClick={onOpenSimulator}>Simulate Activity</button>

        {user && (
          <div className="identity-card">
            <div className="identity-name">{user.name}</div>
            <div className="identity-account">{user.accountName}</div>
            <button className="logout-link" onClick={logout}>Log out</button>
            <div className="app-version">v{__APP_VERSION__}</div>
          </div>
        )}
      </div>

      {modalOpen && (
        <AddNewModal initialType={defaultType} onClose={() => setModalOpen(false)} />
      )}
    </aside>
  );
}
