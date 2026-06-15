import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export async function checkOSNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const result = await LocalNotifications.checkPermissions();
  return result.display === 'granted';
}

export async function requestOSNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const result = await LocalNotifications.requestPermissions();
  return result.display === 'granted';
}
