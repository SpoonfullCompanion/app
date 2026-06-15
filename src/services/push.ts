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

/**
 * Turn push on for a user: request permission, then register their External ID.
 * `unsupported` means we're on web/demo or OneSignal isn't configured; `denied`
 * means the OS permission prompt was declined.
 */
export async function enablePush(profileId: string): Promise<EnablePushResult> {
  if (!pushAvailable()) return { ok: false, reason: 'unsupported' };
  const granted = await requestPushPermission();
  if (!granted) return { ok: false, reason: 'denied' };
  await loginPush(profileId);
  return { ok: true };
}

/** Turn push off for the current device. */
export async function disablePush(): Promise<void> {
  await logoutPush();
}
