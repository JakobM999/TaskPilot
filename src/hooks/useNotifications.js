import { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';

export const useNotifications = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    // Check if browser supports notifications
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);

      // Load saved preferences
      const savedPreference = localStorage.getItem('notifications_enabled');
      if (savedPreference === 'true' && Notification.permission === 'granted') {
        setNotificationsEnabled(true);
      }
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('notifications_enabled', 'true');
        // Use the current user ID if available, otherwise just show a browser notification
        const userId = localStorage.getItem('userId');
        if (userId) {
          notificationService.sendNotification(
            userId, 
            'Notifications Enabled', 
            'You will now receive notifications for upcoming tasks'
          );
        } else {
          // Fallback to browser notification
          new Notification('Notifications Enabled', {
            body: 'You will now receive notifications for upcoming tasks',
            tag: 'notification-enabled'
          });
        }
        return true;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }

    return false;
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotificationsEnabled(true);
        localStorage.setItem('notifications_enabled', 'true');
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem('notifications_enabled', 'false');
    }
  };

  return {
    notificationsEnabled,
    notificationPermission,
    toggleNotifications,
    requestNotificationPermission
  };
};
