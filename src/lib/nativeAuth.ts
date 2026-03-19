import { Capacitor } from '@capacitor/core';

export const NATIVE_AUTH_SCHEME = 'com.spoonfull.app';
export const NATIVE_AUTH_CALLBACK_PATH = 'auth/callback';
export const NATIVE_AUTH_REDIRECT_URL = `${NATIVE_AUTH_SCHEME}://${NATIVE_AUTH_CALLBACK_PATH}`;

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export function getAuthRedirectUrl() {
  if (isNativeApp()) {
    return NATIVE_AUTH_REDIRECT_URL;
  }

  return window.location.origin;
}
