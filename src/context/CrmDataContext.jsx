import { createContext, useContext, useState } from 'react';
import {
  accounts as initialAccounts,
  contacts as initialContacts,
  opportunities as initialOpportunities,
} from '../data/mockData';

const CrmDataContext = createContext(null);

function nextId(records) {
  return records.reduce((max, r) => Math.max(max, r.id), 0) + 1;
}

export function CrmDataProvider({ children }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [contacts, setContacts] = useState(initialContacts);
  const [opportunities, setOpportunities] = useState(initialOpportunities);

  const addAccount = (data) =>
    setAccounts((prev) => [{ id: nextId(prev), ...data }, ...prev]);

  const addContact = (data) =>
    setContacts((prev) => [{ id: nextId(prev), ...data }, ...prev]);

  const addOpportunity = (data) =>
    setOpportunities((prev) => [{ id: nextId(prev), ...data }, ...prev]);

  return (
    <CrmDataContext.Provider
      value={{
        accounts,
        contacts,
        opportunities,
        addAccount,
        addContact,
        addOpportunity,
      }}
    >
      {children}
    </CrmDataContext.Provider>
  );
}

export function useCrmData() {
  const ctx = useContext(CrmDataContext);
  if (!ctx) throw new Error('useCrmData must be used within a CrmDataProvider');
  return ctx;
}
