import { opportunities, forecast } from '../data/mockData';

export default function Dashboard() {
  const openOpps = opportunities.filter((o) => o.stage !== 'Closed Won').slice(0, 8);
  const quotaPct = Math.round((forecast.attained / forecast.quota) * 100);

  return (
    <div className="page">
      <h1>Dashboard</h1>

      <div className="card-grid">
        <div className="card">
          <h3>Forecast</h3>
          <p className="stat">${forecast.attained.toLocaleString()}</p>
          <p className="substat">of ${forecast.quota.toLocaleString()} quota</p>
        </div>
        <div className="card">
          <h3>Quota Attainment</h3>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${quotaPct}%` }} />
          </div>
          <p className="substat">{quotaPct}%</p>
        </div>
        <div className="card">
          <h3>Pipeline</h3>
          <p className="stat">${forecast.pipeline.toLocaleString()}</p>
          <p className="substat">across {opportunities.length} opportunities</p>
        </div>
      </div>

      <div className="table-card">
        <h3>Open Opportunities</h3>
        <table>
          <thead>
            <tr><th>Name</th><th>Account</th><th>Stage</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {openOpps.map((o) => (
              <tr key={o.id}>
                <td>{o.name}</td>
                <td>{o.account}</td>
                <td><span className="badge">{o.stage}</span></td>
                <td>${o.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
