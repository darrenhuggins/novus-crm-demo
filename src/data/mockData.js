const companies = [
  'Schowalter Ltd', 'Rippin and Sons', 'Champlin LLC', 'Beatty LLC',
  'Schmitt Group', 'Nikolaus Inc', 'McDermott Inc', 'Treutel and Sons',
  'Kuhlman Group', 'Wisozk and Daughters', 'Bogisich Ltd', 'Feeney Inc',
];

const firstNames = ['Ava', 'Liam', 'Maya', 'Noah', 'Ivy', 'Ezra', 'Luna', 'Kai'];
const lastNames = ['Torres', 'Nguyen', 'Patel', 'Okafor', 'Reyes', 'Kim', 'Novak', 'Brooks'];

const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won'];

export const accounts = companies.map((name, i) => ({
  id: i + 1,
  name,
  industry: ['Manufacturing', 'Retail', 'Healthcare', 'Finance', 'Technology'][i % 5],
  employees: 50 + i * 37,
  arr: 12000 + i * 4300,
}));

export const contacts = companies.slice(0, 10).map((company, i) => ({
  id: i + 1,
  name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
  title: ['VP of Sales', 'Procurement Lead', 'Director of Ops', 'CTO', 'Account Owner'][i % 5],
  account: company,
  email: `${firstNames[i % firstNames.length].toLowerCase()}.${lastNames[i % lastNames.length].toLowerCase()}@example.com`,
}));

export const opportunities = companies.map((company, i) => ({
  id: i + 1,
  name: `${company} Renewal`,
  account: company,
  stage: stages[i % stages.length],
  amount: 8000 + i * 5200,
  closeDate: `2026-${String((i % 12) + 1).padStart(2, '0')}-15`,
}));

export const forecast = {
  quota: 480000,
  attained: 312000,
  pipeline: 610000,
};
