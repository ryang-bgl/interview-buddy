import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: "public/assets/leetstack.png",
  },
  action: {
    default_icon: {
      48: "public/assets/leetstack.png",
    },
    default_popup: "src/popup/index.html",
  },
  permissions: [
    "cookies",
    "contentSettings",
    "scripting",
    "tabs",
    "activeTab",
    "storage",
    "identity",
  ],
  host_permissions: [
    "https://w2ikvgnue9.execute-api.us-east-1.amazonaws.com/*",
    "https://*.chromiumapp.org/*",
    "https://*.supabase.co/*",
  ],
  content_scripts: [
    {
      js: ["src/content/main.tsx"],
      matches: ["https://*/*"],
    },
  ],
});
