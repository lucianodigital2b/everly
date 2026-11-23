import { t } from '../i18n';

// What the Premium subscription unlocks. One list, shown on the paywall (intro
// step and the plans step without a trial) and enforced by <PremiumOnly> on
// the screens below. Keep the two in step: listing a feature the app doesn't
// actually lock is a misleading-offer rejection waiting to happen.
//
// Free: the Plan tab itself (countdown, progress, up next, the checklist by
// phase) and the whole event album. Guest packs stay a separate one-off
// purchase on top of the subscription.
export const PREMIUM_FEATURES = [
  t('premium.features.guestList'),
  t('premium.features.importExport'),
  t('premium.features.budgetTracker'),
  t('premium.features.timeline'),
] as const;
