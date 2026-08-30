import type {CapacitorConfig} from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sanaoss.zad',
  appName: 'ZAD',
  webDir: 'dist',
  server: {
    // Serve the bundled assets over https on Android to keep cookies/storage stable.
    androidScheme: 'https',
  },
};

export default config;
