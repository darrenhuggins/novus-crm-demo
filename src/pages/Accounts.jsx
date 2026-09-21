import { useCrmData } from '../context/CrmDataContext';

export default function Accounts() {
  const { accounts } = useCrmData();

  return (
    <div className="page">
      <h1>Accounts</h1>
      <div className="table-card">
        <table>
          <thead>
            <tr><th>Name</th><th>Industry</th><th>Employees</th><th>ARR</th></tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.industry}</td>
                <td>{a.employees}</td>
                <td>${a.arr.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
