import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { showError, showSuccess } from '../utils/notifications';
import { useTranslation } from 'react-i18next';

// Configure notifications to show alerts, badges, and sounds
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Hook to handle notification permissions and scheduling
 * @returns {Object} Notification methods and state
 */
export const useNotifications = () => {
  const { t } = useTranslation('notifications');
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [isScheduled, setIsScheduled] = useState(false);
  
  // Check initial permission status on mount
  useEffect(() => {
    const checkInitialPermissions = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        setPermissionStatus(status);
      } catch (error) {
        console.error('Error checking initial permissions:', error);
      }
    };
    
    checkInitialPermissions();
  }, []);
  
  /**
   * Get a random variant from an array of notification texts
   * @param {Array|string} variants - Array of text variants or a single string
   * @returns {string} A randomly selected variant
   */
  const getRandomVariant = (variants) => {
    // If variants is not an array (e.g., a string), return it as is
    if (!Array.isArray(variants)) {
      return variants;
    }
    const randomIndex = Math.floor(Math.random() * variants.length);
    return variants[randomIndex];
  };

  /**
   * Request notification permissions
   * @returns {Promise<boolean>} Whether permission was granted
   */
  const requestPermissions = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Only ask if permissions have not been determined
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      setPermissionStatus(finalStatus);
      return finalStatus === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      showError('Failed to request notification permissions');
      return false;
    }
  };

  /**
   * Schedule daily notifications at 9 AM and 6 PM
   * @returns {Promise<boolean>} Whether scheduling was successful
   */
  const scheduleDailyNotifications = async () => {
    try {
      // Check permissions first
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        showError(t('permission_required'));
        return false;
      }

      // Cancel any existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      console.log(t('morning.title', { returnObjects: true }));
      
      // Get current date and time
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      let notificationTime;
      let notificationContent;
      
      if (currentHour < 9 || (currentHour === 9 && currentMinute < 0)) {
        // Before 9 AM - schedule morning notification for today
        notificationTime = new Date();
        notificationTime.setHours(9, 0, 0, 0);
        // If we're very close to 9 AM (within 1 minute), schedule for tomorrow instead
        if (currentHour === 8 && currentMinute >= 59) {
          notificationTime.setDate(notificationTime.getDate() + 1);
        }
        notificationContent = {
          title: getRandomVariant(t('morning.title', { returnObjects: true })),
          body: getRandomVariant(t('morning.body', { returnObjects: true })),
        };
      } else if (currentHour < 18 || (currentHour === 18 && currentMinute < 0)) {
        // Between 9 AM and 6 PM - schedule evening notification for today
        notificationTime = new Date();
        notificationTime.setHours(18, 0, 0, 0);
        // If we're very close to 6 PM (within 1 minute), schedule morning for tomorrow instead
        if (currentHour === 17 && currentMinute >= 59) {
          notificationTime.setDate(notificationTime.getDate() + 1);
          notificationTime.setHours(9, 0, 0, 0);
          notificationContent = {
            title: getRandomVariant(t('morning.title', { returnObjects: true })),
            body: getRandomVariant(t('morning.body', { returnObjects: true })),
          };
        } else {
          notificationContent = {
            title: getRandomVariant(t('evening.title', { returnObjects: true })),
            body: getRandomVariant(t('evening.body', { returnObjects: true })),
          };
        }
      } else {
        // After 6 PM - schedule morning notification for tomorrow
        notificationTime = new Date();
        notificationTime.setDate(notificationTime.getDate() + 1);
        notificationTime.setHours(9, 0, 0, 0);
        notificationContent = {
          title: getRandomVariant(t('morning.title', { returnObjects: true })),
          body: getRandomVariant(t('morning.body', { returnObjects: true })),
        };
      }
      
      // Schedule the single notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          ...notificationContent,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          date: notificationTime,
          repeats: true,
        },
      });

      setIsScheduled(true);
      showSuccess(t('notifications.reminders_set'));
      return true;
    } catch (error) {
      console.error('Error scheduling notifications:', error);
      showError(t('notifications.schedule_failed'));
      return false;
    }
  };

  /**
   * Cancel all scheduled notifications
   */
  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setIsScheduled(false);
      showSuccess(t('notifications.notifications_canceled'));
      return true;
    } catch (error) {
      console.error('Error canceling notifications:', error);
      showError(t('notifications.cancel_failed'));
      return false;
    }
  };

  /**
   * Schedule a streak notification
   * @param {number} days - Number of days in the streak
   * @returns {Promise<boolean>} Whether scheduling was successful
   */
  const scheduleStreakNotification = async (days) => {
    try {
      // Check permissions first
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        showError(t('notifications.permission_required'));
        return false;
      }

      // Schedule streak notification for now
      await Notifications.scheduleNotificationAsync({
        content: {
          title: getRandomVariant(t('notifications.streak.title', { returnObjects: true })),
          body: getRandomVariant(t('notifications.streak.body', { returnObjects: true }))
            .replace('{{days}}', days.toString()),
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Send immediately
      });

      return true;
    } catch (error) {
      console.error('Error scheduling streak notification:', error);
      showError(t('notifications.schedule_failed'));
      return false;
    }
  };

  return {
    permissionStatus,
    isScheduled,
    requestPermissions,
    scheduleDailyNotifications,
    cancelAllNotifications,
    scheduleStreakNotification,
  };
};