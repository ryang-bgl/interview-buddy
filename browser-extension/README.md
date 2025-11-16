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

4. Open Chrome and navigate to `chrome://extensions/`, enable "Developer mode", and load the unpacked extension from the `dist` directory.

5. Build for production:

```bash
npm run build
```

## Project Structure

- `src/popup/` - Extension popup UI
- `src/content/` - Content scripts
- `manifest.config.ts` - Chrome extension manifest configuration
- `src/lib/supabaseClient.ts` - Supabase client initialization used by the popup

## Documentation

- [React Documentation](https://reactjs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [CRXJS Documentation](https://crxjs.dev/vite-plugin)

## Chrome Extension Development Notes

- The popup uses Supabase email OTP. Users receive a short code via email, enter it, and the Supabase session token is forwarded to the AWS API Gateway.
- Use `manifest.config.ts` to configure permissions/hosts; the extension needs `identity` plus access to your Supabase project URL and API Gateway domain.
- The CRXJS plugin automatically handles manifest generation.
- Content scripts should be placed in `src/content/` and popup UI in `src/popup/`.
