import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: 'public/logo.png',
  },
  action: {
    default_icon: {
      48: 'public/logo.png',
    },
    default_popup: 'src/popup/index.html',
  },
  permissions: [
    'sidePanel',
    'cookies',
    'contentSettings',
    'scripting',
    'tabs',
    'activeTab',
    'storage',
    'identity'
  ],
  host_permissions: [
    'http://localhost:8080/*',
    'https://local.leetstack.app:8443/*',
    'https://*.googleapis.com/*',
    'https://*.google.com/*',
    'https://*.firebaseapp.com/*',
    'https://*.chromiumapp.org/*'
  ],
  content_scripts: [{
    js: ['src/content/main.tsx'],
    matches: ['https://*/*'],
  }],
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
})
