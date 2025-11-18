# Repository Guidelines

## Project Structure & Module Organization
Expo Router screens live in `src/app`, with grouped routes such as `src/app/(tabs)/index.tsx` for the reviewer flow and `src/app/(auth)` for sign-in. Shared UI is in `src/components`, with snapshots in `src/components/__tests__`. Global state sits inside `src/stores` (Zustand), HTTP helpers in `src/services/api.ts`, and spaced-repetition logic in `src/utils/fsrScheduler.ts`. Import cross-cutting modules through the `@/` alias declared in `tsconfig.json`. Place imagery and fonts under `src/assets` so Expo can bundle them.

## Build, Test, and Development Commands
- `npm install` — install or refresh workspace dependencies.
- `npm start` — launch the Expo dev server with Metro bundler.
- `npm run ios` / `npm run android` — open the native client simulators against the running dev server.
- `npm run web` — serve the project in a browser via Expo Router web output.
- `npx jest` — execute Jest snapshots and component tests under `src/components/__tests__`.

## Coding Style & Naming Conventions
Write TypeScript-first components with 2-space indentation and semicolons, matching existing files. Use PascalCase for components (`GlobalNotification.tsx`) and camelCase for hooks or utilities (`useStores`, `fsrScheduler`). Keep modules focused: screens render UI, stores manage state, and helpers stay in `src/utils`. Favor React hooks, avoid `any`, and surface reusable colors via `src/constants/Colors.ts`.

## Testing Guidelines
Jest with `react-test-renderer` powers current coverage; extend it with `@testing-library/react-native` when adding interactive flows. Co-locate specs using `*.test.ts(x)` either beside the module or inside a sibling `__tests__` folder. Snapshot updates must be intentional—run `npx jest --updateSnapshot` only after verifying UI changes in the simulator. New logic in stores or utilities should receive deterministic unit tests instead of relying solely on snapshots.

## Commit & Pull Request Guidelines
Craft short, imperative commit subjects ("Add spaced review store sync") and group related edits together. Before opening a PR, run the simulator or web build you touched plus `npx jest`. PR descriptions should outline the change, note any env variable updates, link issues, and attach screenshots for UI adjustments. Flag follow-ups explicitly rather than leaving TODOs in code.

## Security & Configuration Tips
Secrets never belong in Git; copy `.env.example` to `.env` and supply Firebase keys plus `EXPO_PUBLIC_API_URL`. Review `src/config/firebase.ts` and `FIREBASE_SETUP.md` when rotating credentials. Keep development keys scoped to dev projects, and revoke unused dynamic link domains. If you modify deep linking or auth redirects, update `app.json` and share the expected callback URLs in the PR.
