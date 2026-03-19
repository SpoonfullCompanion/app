import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { appConfig } from '../lib/appConfig';

export interface NotificationStatus {
  pushConfigured: boolean;
  localNotificationsAvailable: boolean;
}

export async function getNotificationStatus(): Promise<NotificationStatus> {
  return {
    pushConfigured: appConfig.hasOneSignal,
    localNotificationsAvailable: Capacitor.isNativePlatform(),
  };
}

export async function requestLocalNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  const result = await LocalNotifications.requestPermissions();
  return result.display === 'granted';
}

export async function scheduleLocalReminder() {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  const permissionGranted = await requestLocalNotificationPermission();
  if (!permissionGranted) {
    return false;
  }

  await LocalNotifications.schedule({
    notifications: [
      {
        id: 1,
        title: 'Spoonfull reminder',
        body: 'Check the latest patient status update.',
        schedule: { at: new Date(Date.now() + 60_000) },
      },
    ],
  });

  return true;
}
