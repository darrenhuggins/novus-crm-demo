import { opportunities } from '../data/mockData';

export default function Opportunities() {
  return (
    <div className="page">
      <h1>Opportunities</h1>
      <div className="table-card">
        <table>
          <thead>
            <tr><th>Name</th><th>Account</th><th>Stage</th><th>Amount</th><th>Close Date</th></tr>
          </thead>
          <tbody>
            {opportunities.map((o) => (
              <tr key={o.id}>
                <td>{o.name}</td>
                <td>{o.account}</td>
                <td><span className="badge">{o.stage}</span></td>
                <td>${o.amount.toLocaleString()}</td>
                <td>{o.closeDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
