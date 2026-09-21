# novusCRM

A tiny mock CRM app (Dashboard / Accounts / Contacts / Opportunities), inspired
by Pendo's [acmeCRM demo](https://crm.pendoexperience.io). Built to be a
lightweight surface for connecting Pendo Novus.

## Running locally

```bash
npm install
npm run dev
```

## Connecting Novus

Once you have your Pendo Novus install snippet:

1. Paste it into `index.html`, right where the comment says to (before `</head>`).
2. `src/components/NovusWidget.jsx` is a placeholder launcher/panel — once
   Novus's own snippet is installed, it will typically render its own
   launcher, and this stand-in can be removed.

## Deploying

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the
app and publishes it to GitHub Pages. Enable Pages for this repo (Settings →
Pages → Source: GitHub Actions) after the first push.
