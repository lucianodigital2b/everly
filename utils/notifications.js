import { notificationsStore } from '../zustand/notifications';
import notificationsActions from '../zustand/notifications/actions';

/**
 * Utility function to show notifications globally
 * @param {Object} notification - The notification object
 * @param {string} notification.message - The notification message
 * @param {string} [notification.title] - The notification title (optional)
 * @param {string} [notification.type='info'] - The notification type (success, error, warning, info)
 */
export const showNotification = (notification) => {
  const notifications = notificationsStore.getState();
  const { notificationsShow } = notificationsActions(notifications.dispatch);
  
  const notificationData = {
    message: notification.message,
    title: notification.title || null,
    type: notification.type || 'info',
    timestamp: new Date().toISOString(),
  };
  
  notificationsShow(notificationData);
};

/**
 * Utility function to show success notifications
 * @param {string} message - The success message
 * @param {string} [title] - The notification title (optional)
 */
export const showSuccess = (message, title) => {
  showNotification({ message, title, type: 'success' });
};

/**
 * Utility function to show error notifications
 * @param {string} message - The error message
 * @param {string} [title] - The notification title (optional)
 */
export const showError = (message, title) => {
  showNotification({ message, title, type: 'error' });
};

/**
 * Utility function to show warning notifications
 * @param {string} message - The warning message
 * @param {string} [title] - The notification title (optional)
 */
export const showWarning = (message, title) => {
  showNotification({ message, title, type: 'warning' });
};

/**
 * Utility function to show info notifications
 * @param {string} message - The info message
 * @param {string} [title] - The notification title (optional)
 */
export const showInfo = (message, title) => {
  showNotification({ message, title, type: 'info' });
};