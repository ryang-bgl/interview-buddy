# React + Vite + CRXJS

This template helps you quickly start developing Chrome extensions with React, TypeScript and Vite. It includes the CRXJS Vite plugin for seamless Chrome extension development.

## Features

- React with TypeScript
- TypeScript support
- Vite build tool
- CRXJS Vite plugin integration
- Chrome extension manifest configuration

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Configure Firebase Auth for email-link login:
   - Generate Web credentials in Firebase and paste them into `src/config/appConfig.dev.json`/`.prod.json` (`apiKey`, `authDomain`, `projectId`).
   - Set `actionCodeSettings.url` to the redirect returned by `chrome.identity.getRedirectURL('firebase-email-link')` (e.g., `https://<EXTENSION_ID>.chromiumapp.org/__/auth`) and add that domain to Firebase's authorized domains.
   - Enable the **Email link (passwordless sign-in)** provider in Firebase Authentication.

4. Open Chrome and navigate to `chrome://extensions/`, enable "Developer mode", and load the unpacked extension from the `dist` directory.

5. Build for production:

```bash
npm run build
```

## Project Structure

- `src/popup/` - Extension popup UI
- `src/content/` - Content scripts
- `manifest.config.ts` - Chrome extension manifest configuration
- `src/lib/firebaseClient.ts` - Firebase initialization used by the popup

## Documentation

- [React Documentation](https://reactjs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [CRXJS Documentation](https://crxjs.dev/vite-plugin)

## Chrome Extension Development Notes

- The popup uses Firebase email-link authentication (`sendSignInLinkToEmail` + `signInWithEmailLink`). Users enter their email, receive a passwordless link, and paste it into the popup to finish signing in—no API keys required.
- Use `manifest.config.ts` to configure permissions/hosts; Firebase requires the `identity` permission plus Google/Firebase host access.
- The CRXJS plugin automatically handles manifest generation.
- Content scripts should be placed in `src/content/` and popup UI in `src/popup/`.
