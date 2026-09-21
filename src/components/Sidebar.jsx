import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import AddNewModal from './AddNewModal';

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

export default function Sidebar() {
  const [modalOpen, setModalOpen] = useState(false);
  const location = useLocation();
  const defaultType = typeForPath[location.pathname] ?? 'Opportunity';

  return (
    <aside className="sidebar">
      <div className="brand">novusCRM</div>
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
      <button className="add-new-btn" onClick={() => setModalOpen(true)}>+ Add New</button>

      {modalOpen && (
        <AddNewModal initialType={defaultType} onClose={() => setModalOpen(false)} />
      )}
    </aside>
  );
}
