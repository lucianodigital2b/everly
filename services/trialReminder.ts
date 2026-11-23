import * as Notifications from 'expo-notifications';

// PermissionResponse (expo-modules-core) doesn't resolve for tsc here.
type Perm = { granted: boolean; canAskAgain: boolean };
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';
import { t } from '../i18n';

const IDENTIFIER = 'trial-reminder';
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Local "your trial ends tomorrow" notification, the reminder the paywall's
 * timeline promises. Fire and forget after a trial starts.
 */
export async function scheduleTrialReminder({
  trialDays,
  price,
}: {
  trialDays: number;
  price: string;
}): Promise<void> {
  try {
    let perm = (await Notifications.getPermissionsAsync()) as Perm;
    if (!perm.granted && perm.canAskAgain) {
      perm = (await Notifications.requestPermissionsAsync()) as Perm;
    }
    if (!perm.granted) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    await Notifications.cancelScheduledNotificationAsync(IDENTIFIER);
    const fireAt = Math.max(
      Date.now() + trialDays * DAY_MS - DAY_MS,
      Date.now() + DAY_MS / 24,
    );
    await Notifications.scheduleNotificationAsync({
      identifier: IDENTIFIER,
      content: {
        title: t('trialReminder.title'),
        body: t('trialReminder.body', { price }),
        data: { type: IDENTIFIER },
      },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: new Date(fireAt) },
    });
  } catch (e) {
    console.warn('[TrialReminder] scheduling failed', e);
  }
}
