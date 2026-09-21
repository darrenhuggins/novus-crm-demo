import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import NovusWidget from './components/NovusWidget';
import LoginGate from './components/LoginGate';
import ActivitySimulator from './components/ActivitySimulator';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Contacts from './pages/Contacts';
import Opportunities from './pages/Opportunities';
import { CrmDataProvider } from './context/CrmDataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

function AppContent() {
  const { user } = useAuth();
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  return (
    <>
      {user ? (
        <div className="app-shell">
          <Sidebar onOpenSimulator={() => setSimulatorOpen(true)} />
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
      ) : (
        <LoginGate onRunSimulator={() => setSimulatorOpen(true)} />
      )}
      <ActivitySimulator open={simulatorOpen} onClose={() => setSimulatorOpen(false)} />
    </>
  );
}

function App() {
  return (
    <CrmDataProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </CrmDataProvider>
  );
}

export default App
