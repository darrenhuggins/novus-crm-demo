import { useState } from 'react';
import { useCrmData } from '../context/CrmDataContext';
import { industries, contactTitles, stages } from '../data/mockData';

const TYPES = ['Account', 'Contact', 'Opportunity'];

const emptyForm = {
  Account: { name: '', industry: industries[0], employees: '', arr: '' },
  Contact: { name: '', title: contactTitles[0], account: '', email: '' },
  Opportunity: { name: '', account: '', stage: stages[0], amount: '', closeDate: '' },
};

export default function AddNewModal({ initialType, onClose }) {
  const { accounts, opportunities, addAccount, addContact, addOpportunity } = useCrmData();
  const [type, setType] = useState(initialType);
  const [form, setForm] = useState(emptyForm[initialType]);

  const changeType = (nextType) => {
    setType(nextType);
    setForm(emptyForm[nextType]);
  };

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'Account') {
      addAccount({
        name: form.name,
        industry: form.industry,
        employees: Number(form.employees) || 0,
        arr: Number(form.arr) || 0,
      });
      if (typeof pendo !== 'undefined') {
        pendo.track('account_created', {
          industry: form.industry,
          employees: Number(form.employees) || 0,
          arr: Number(form.arr) || 0,
        });
      }
    } else if (type === 'Contact') {
      addContact({
        name: form.name,
        title: form.title,
        account: form.account,
        email: form.email,
      });
      if (typeof pendo !== 'undefined') {
        pendo.track('contact_created', {
          title: form.title,
          account: form.account,
        });
      }
    } else {
      const opportunityId = opportunities.reduce((max, r) => Math.max(max, r.id), 0) + 1;
      addOpportunity({
        name: form.name,
        account: form.account,
        stage: form.stage,
        amount: Number(form.amount) || 0,
        closeDate: form.closeDate,
      });
      if (typeof pendo !== 'undefined') {
        pendo.track('opportunity_created', {
          opportunityId,
          stage: form.stage,
          amount: Number(form.amount) || 0,
          account: form.account,
          closeDate: form.closeDate,
        });
      }
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New</h3>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-tabs">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={t === type ? 'modal-tab active' : 'modal-tab'}
              onClick={() => changeType(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Name
            <input
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder={type === 'Contact' ? 'Full name' : `${type} name`}
            />
          </label>

          {type === 'Account' && (
            <>
              <label>
                Industry
                <select value={form.industry} onChange={(e) => update('industry', e.target.value)}>
                  {industries.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </label>
              <label>
                Employees
                <input type="number" min="0" value={form.employees} onChange={(e) => update('employees', e.target.value)} />
              </label>
              <label>
                ARR
                <input type="number" min="0" value={form.arr} onChange={(e) => update('arr', e.target.value)} />
              </label>
            </>
          )}

          {type === 'Contact' && (
            <>
              <label>
                Title
                <select value={form.title} onChange={(e) => update('title', e.target.value)}>
                  {contactTitles.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label>
                Account
                <select required value={form.account} onChange={(e) => update('account', e.target.value)}>
                  <option value="" disabled>Select an account</option>
                  {accounts.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </label>
              <label>
                Email
                <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />
              </label>
            </>
          )}

          {type === 'Opportunity' && (
            <>
              <label>
                Account
                <select required value={form.account} onChange={(e) => update('account', e.target.value)}>
                  <option value="" disabled>Select an account</option>
                  {accounts.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </label>
              <label>
                Stage
                <select value={form.stage} onChange={(e) => update('stage', e.target.value)}>
                  {stages.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label>
                Amount
                <input type="number" min="0" value={form.amount} onChange={(e) => update('amount', e.target.value)} />
              </label>
              <label>
                Close Date
                <input type="date" value={form.closeDate} onChange={(e) => update('closeDate', e.target.value)} />
              </label>
            </>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save {type}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
