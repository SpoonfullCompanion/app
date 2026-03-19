import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.spoonfull.app',
  appName: 'Spoonfull',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    contentInset: 'always',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
