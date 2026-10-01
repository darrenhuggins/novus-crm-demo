import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { OpenFeature } from '@openfeature/web-sdk'
import { PendoProvider } from '@pendo/openfeature-web-provider'
import './index.css'
import App from './App.jsx'

/* global pendo */
const VISITOR_ID_KEY = 'novuscrm_visitor_id'

function getOrCreateVisitorId() {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY)
  if (!visitorId) {
    visitorId = crypto.randomUUID()
    localStorage.setItem(VISITOR_ID_KEY, visitorId)
  }
  return visitorId
}

pendo.initialize({
  visitor: {
    id: getOrCreateVisitorId(),
  },
  // Required by @pendo/openfeature-web-provider: without this, Pendo never
  // fires `segmentFlagsUpdated` on pendo.identify(), so feature flags (e.g.
  // helpButtonEnabled) only ever reflect the account active at page load,
  // not whoever's logged in now -- stuck until the next full refresh.
  requestSegmentFlags: true,
})

OpenFeature.setProviderAndWait(new PendoProvider())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
