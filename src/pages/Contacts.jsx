import { useCrmData } from '../context/CrmDataContext';

export default function Contacts() {
  const { contacts } = useCrmData();

  return (
    <div className="page">
      <h1>Contacts</h1>
      <div className="table-card">
        <table>
          <thead>
            <tr><th>Name</th><th>Title</th><th>Account</th><th>Email</th></tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.title}</td>
                <td>{c.account}</td>
                <td>{c.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
