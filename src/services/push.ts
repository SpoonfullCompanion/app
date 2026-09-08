import { Capacitor } from '@capacitor/core';
import { appConfig } from '../lib/appConfig';

/**
 * OneSignal push integration.
 *
 * OneSignal ships as a Cordova plugin that talks to native code via
 * `window.cordova.exec`, so it only does anything on a real device. We lazy-load
 * it and guard every call behind `pushAvailable()` so the web/demo build never
 * touches it. A user's `profileId` (which equals their Supabase auth id) is
 * registered as the OneSignal External ID — that is how the `send-push` Edge
 * Function targets specific people.
 */

type OneSignalApi = (typeof import('onesignal-cordova-plugin'))['default'];

let oneSignalPromise: Promise<OneSignalApi | null> | null = null;
let initialized = false;

function pushAvailable(): boolean {
  return (
    Capacitor.isNativePlatform() &&
    appConfig.hasOneSignal &&
    Boolean(appConfig.oneSignalAppId)
  );
}

async function loadOneSignal(): Promise<OneSignalApi | null> {
  if (!pushAvailable()) return null;
  if (!oneSignalPromise) {
    oneSignalPromise = import('onesignal-cordova-plugin')
      .then((mod) => mod.default)
      .catch((error) => {
        console.error('Failed to load OneSignal plugin', error);
        return null;
      });
  }
  return oneSignalPromise;
}

/** Initialize OneSignal once, on native launch. Safe to call repeatedly. */
export async function initPush(): Promise<void> {
  if (initialized) return;
  const OneSignal = await loadOneSignal();
  if (!OneSignal) return;
  OneSignal.initialize(appConfig.oneSignalAppId as string);
  initialized = true;
}

/** Prompt for the OS push permission. Returns true when granted. */
export async function requestPushPermission(): Promise<boolean> {
  const OneSignal = await loadOneSignal();
  if (!OneSignal) return false;
  await initPush();
  try {
    return await OneSignal.Notifications.requestPermission(true);
  } catch (error) {
    console.error('OneSignal permission request failed', error);
    return false;
  }
}

/** Associate this device with a user so the backend can target them by profileId. */
export async function loginPush(profileId: string): Promise<void> {
  const OneSignal = await loadOneSignal();
  if (!OneSignal) return;
  await initPush();
  OneSignal.login(profileId);
}

/** Disassociate this device (sign-out, or the user turning push off). */
export async function logoutPush(): Promise<void> {
  const OneSignal = await loadOneSignal();
  if (!OneSignal) return;
  OneSignal.logout();
}

export type EnablePushResult = { ok: boolean; reason?: 'unsupported' | 'denied' };

export type PushNotificationData = {
  updateId?: string;
  patientId?: string;
  kind?: string;
};

let pendingClickData: PushNotificationData | null = null;

/** Store notification data from a cold-start launch until a handler is registered. */
export function setPendingNotificationData(data: PushNotificationData | null) {
  pendingClickData = data;
}

/** Get and clear any notification data saved before the handler was ready. */
export function consumePendingNotificationData(): PushNotificationData | null {
  const data = pendingClickData;
  pendingClickData = null;
  return data;
}

/**
 * Register a callback for notification taps. On cold start the callback fires
 * after the listener is attached; any data captured before that is delivered
 * immediately.
 */
export async function setupNotificationClickHandler(
  onClick: (data: PushNotificationData) => void
): Promise<void> {
  const OneSignal = await loadOneSignal();
  if (!OneSignal) return;
  await initPush();

  try {
    OneSignal.Notifications.addEventListener('notificationClick', (e: { notification?: { additionalData?: Record<string, unknown> } }) => {
      const raw = e?.notification?.additionalData ?? {};
      const data: PushNotificationData = {
        updateId: raw.updateId as string | undefined,
        patientId: raw.patientId as string | undefined,
        kind: raw.kind as string | undefined,
      };
      if (data.updateId) onClick(data);
    });
  } catch (error) {
    console.error('OneSignal notificationClick listener failed', error);
  }

  const saved = consumePendingNotificationData();
  if (saved?.updateId) onClick(saved);
}

/**
 * Turn push on: request OS permission, opt the device's push subscription in,
 * and register the External ID. `unsupported` means web/demo or OneSignal isn't
 * configured; `denied` means the OS prompt was declined.
 */
export async function enablePush(profileId: string): Promise<EnablePushResult> {
  if (!pushAvailable()) return { ok: false, reason: 'unsupported' };
  const granted = await requestPushPermission();
  if (!granted) return { ok: false, reason: 'denied' };
  const OneSignal = await loadOneSignal();
  OneSignal?.User.pushSubscription.optIn();
  await loginPush(profileId);
  return { ok: true };
}

/** Mute push for this device (opt out) without changing the OS permission. */
export async function disablePush(): Promise<void> {
  const OneSignal = await loadOneSignal();
  OneSignal?.User.pushSubscription.optOut();
}

/**
 * Whether this device will actually receive push right now: OS permission
 * granted AND the OneSignal subscription opted in. This is the real state the
 * Settings toggle should show — not just a stored preference.
 */
export async function isPushActive(): Promise<boolean> {
  const OneSignal = await loadOneSignal();
  if (!OneSignal) return false;
  await initPush();
  try {
    const native = await OneSignal.Notifications.permissionNative();
    // OSNotificationPermission: 2=Authorized, 3=Provisional, 4=Ephemeral.
    if (native !== 2 && native !== 3 && native !== 4) return false;
    return await OneSignal.User.pushSubscription.getOptedInAsync();
  } catch {
    return false;
  }
}

export type PushPermissionStatus = 'granted' | 'denied' | 'notDetermined' | 'unsupported';

/**
 * Returns the raw OS permission state without side effects. Used by the UI to
 * decide whether to show a toggle, an "Open Settings" button, or an enable prompt.
 */
export async function getPushPermissionStatus(): Promise<PushPermissionStatus> {
  if (!pushAvailable()) return 'unsupported';
  const OneSignal = await loadOneSignal();
  if (!OneSignal) return 'unsupported';
  await initPush();
  try {
    const native = await OneSignal.Notifications.permissionNative();
    // OSNotificationPermission: 0=NotDetermined, 1=Denied, 2=Authorized, 3=Provisional, 4=Ephemeral.
    if (native === 0) return 'notDetermined';
    if (native === 1) return 'denied';
    return 'granted';
  } catch {
    return 'unsupported';
  }
}

/**
 * Open the iOS Settings app directly to the Spoonfull notification settings page.
 * On Android, opens the app's notification settings channel.
 */
export async function openNotificationSettings(): Promise<void> {
  const platform = Capacitor.getPlatform();
  if (platform === 'ios') {
    window.open('app-settings:');
  } else if (platform === 'android') {
    // On Android, open the app notification settings
    window.open('package:com.spoonfull.app');
  }
}

/**
 * Reconcile push state on launch; returns whether push is effectively active so
 * the caller can persist it to notification_preferences (which the server uses
 * to decide who to notify).
 *
 * - Permission not yet determined: show the OS prompt once; opt in if granted.
 * - Already granted + opted in: register the External ID.
 * - Denied or opted out: not active.
 *
 * Fixes the case where a user has iOS notifications on but the app never
 * recorded push_enabled=true, so the server silently skipped them.
 */
export async function reconcilePush(profileId: string): Promise<boolean> {
  if (!pushAvailable()) return false;
  const OneSignal = await loadOneSignal();
  if (!OneSignal) return false;
  await initPush();

  let granted: boolean;
  try {
    const native = await OneSignal.Notifications.permissionNative();
    if (native === 0) {
      // NotDetermined → first-launch prompt.
      granted = await OneSignal.Notifications.requestPermission(true);
      if (granted) OneSignal.User.pushSubscription.optIn();
    } else {
      granted = native === 2 || native === 3 || native === 4;
    }
  } catch {
    return false;
  }
  if (!granted) return false;

  let optedIn = true;
  try {
    optedIn = await OneSignal.User.pushSubscription.getOptedInAsync();
  } catch {
    optedIn = true;
  }
  if (!optedIn) return false;

  OneSignal.login(profileId);
  return true;
}
