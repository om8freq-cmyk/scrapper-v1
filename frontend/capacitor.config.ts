import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cognitivecrm.app',
  appName: 'Cognitive CRM',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    allowNavigation: ['*']
  }
};

export default config;
