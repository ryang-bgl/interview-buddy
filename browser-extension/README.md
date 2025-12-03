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

3. Configure Supabase email OTP:
   - Create a Supabase project and copy the project URL + anon key into `src/config/appConfig.dev.json`/`.prod.json`.
   - Under **Authentication → Settings**, enable **Email OTP** and customize the magic-link template if desired.
   - Add your Chrome extension redirect (`https://<EXTENSION_ID>.chromiumapp.org/auth`) to the "Redirect URLs" list so Supabase is allowed to complete the flow.

4. Open Chrome and navigate to `chrome://extensions/`, enable "Developer mode", and load the unpacked extension from the `dist` directory. Pin the extension icon and click it to toggle the Chrome side panel powered by this UI. Chrome will prompt for "Read your browsing history" because the extension now injects scripts into any tab (`<all_urls>`) to support element selection and scraping; approve the prompt so the AI can read the current page content.

5. Build for production:

```bash
npm run build
```

## Project Structure

- `src/popup/` - React UI rendered inside the Chrome side panel
- `src/content/` - Content scripts
- `manifest.config.ts` - Chrome extension manifest configuration
- `src/lib/supabaseClient.ts` - Supabase client initialization used by the popup

## Documentation

- [React Documentation](https://reactjs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [CRXJS Documentation](https://crxjs.dev/vite-plugin)

## Chrome Extension Development Notes

- The side panel uses Supabase email OTP. Users receive a short code via email, enter it, and the Supabase session token is forwarded to the AWS API Gateway.
- Use `manifest.config.ts` to configure permissions/hosts; the extension needs `identity` plus access to your Supabase project URL and API Gateway domain.
- The CRXJS plugin automatically handles manifest generation.
- Content scripts should be placed in `src/content/` and the side panel UI in `src/popup/`.
