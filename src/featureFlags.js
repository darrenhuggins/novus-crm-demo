import { OpenFeature, ProviderEvents } from '@openfeature/web-sdk';
import { PendoProvider } from '@pendo/openfeature-web-provider';

export const pendoProvider = new PendoProvider();

export function initFeatureFlags() {
  return OpenFeature.setProviderAndWait(pendoProvider);
}

// @pendo/openfeature-web-provider only re-evaluates flags when it sees
// window.pendo.Events.segmentFlagsUpdated fire -- but the Pendo agent
// loaded here (confirmed on the live deployed app, version 2.343.0_prod-io)
// has no `Events` namespace at all, so that never happens. Calling this
// manually emits the same ConfigurationChanged event the provider would
// emit itself, using its own public event emitter -- the documented way
// OpenFeature providers signal a change, and confirmed (by reading
// @openfeature/react-sdk's source) to be what useBooleanFlagValue and
// friends subscribe to by default.
function refreshFeatureFlags() {
  pendoProvider.events.emit(ProviderEvents.ConfigurationChanged);
}

// window.pendo.segmentFlags does NOT update synchronously with
// pendo.identify() -- timed on the live site: identify() returned with
// segmentFlags still reflecting the outgoing account, and the new
// account's flags only landed ~150-200ms later. A single refresh called
// right after identify() just re-confirms the stale value, which is why
// the Help button stayed wrong until a page reload even after wiring up
// refreshFeatureFlags() to fire post-identify.
//
// There's no event to wait on (see above), so poll for the array to
// actually change and refresh the moment it does, for up to ~1.5s.
export function refreshFeatureFlagsAfterIdentify() {
  let lastSeen = JSON.stringify(window.pendo?.segmentFlags);
  let ticks = 0;
  const maxTicks = 10;
  const intervalId = setInterval(() => {
    ticks += 1;
    const current = JSON.stringify(window.pendo?.segmentFlags);
    if (current !== lastSeen) {
      lastSeen = current;
      refreshFeatureFlags();
    }
    if (ticks >= maxTicks) clearInterval(intervalId);
  }, 150);
}
