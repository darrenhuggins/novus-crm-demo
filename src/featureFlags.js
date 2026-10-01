import { OpenFeature, ProviderEvents } from '@openfeature/web-sdk';
import { PendoProvider } from '@pendo/openfeature-web-provider';

export const pendoProvider = new PendoProvider();

export function initFeatureFlags() {
  return OpenFeature.setProviderAndWait(pendoProvider);
}

// @pendo/openfeature-web-provider only re-evaluates flags when it sees
// window.pendo.Events.segmentFlagsUpdated fire -- but the Pendo agent
// loaded here (confirmed on the live deployed app, version 2.343.0_prod-io)
// has no `Events` namespace at all. window.pendo.segmentFlags itself
// *does* update immediately on pendo.identify(), with no measurable delay;
// nothing ever tells OpenFeature to look at it again, so flag-gated UI
// (e.g. the sidebar Help button) was stuck until a full page reload.
// Call this right after identify() to manually trigger the same
// ConfigurationChanged event the provider would emit if the agent
// supported it, using the provider's own public event emitter.
export function refreshFeatureFlags() {
  pendoProvider.events.emit(ProviderEvents.ConfigurationChanged);
}
