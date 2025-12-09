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
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  side_panel: {
    default_path: "src/popup/index.html",
  },
  permissions: ["scripting", "activeTab", "storage", "sidePanel"],
  host_permissions: ["<all_urls>"],
});
