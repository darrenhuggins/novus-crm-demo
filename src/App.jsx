import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import NovusWidget from './components/NovusWidget';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Contacts from './pages/Contacts';
import Opportunities from './pages/Opportunities';
import { CrmDataProvider } from './context/CrmDataContext';
import './App.css';

function App() {
  return (
    <CrmDataProvider>
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/opportunities" element={<Opportunities />} />
          </Routes>
        </main>
        <NovusWidget />
      </div>
    </CrmDataProvider>
  );
}

export default App
