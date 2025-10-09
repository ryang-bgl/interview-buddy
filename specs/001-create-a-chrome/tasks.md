# Tasks: Save LeetCode Problems from Chrome Extension

**Input**: Design documents from `/Users/ryang/ryang/projects/interview-buddy/specs/001-create-a-chrome/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Confirm scope shift: focus on Chrome extension; backend API replaced with Vite-served mock endpoints
2. Load design docs to align types, contracts, and scenarios with frontend implementation
3. Generate ordered tasks (setup → tests → implementation → integration → polish) with mock API strategy
4. Mark [P] only when tasks touch independent files and share no dependencies
5. Provide dependency mapping plus parallel execution guidance for Task agents
```

## Phase 3.1: Setup
- [ ] T001 Initialize MV3 extension toolchain with Vite + React TypeScript in `/Users/ryang/ryang/projects/interview-buddy/browser-extension/package.json`, `/Users/ryang/ryang/projects/interview-buddy/browser-extension/tsconfig.json`, `/Users/ryang/ryang/projects/interview-buddy/browser-extension/vite.config.ts`, and `/Users/ryang/ryang/projects/interview-buddy/browser-extension/manifest.json` (Depends on: none)
- [ ] T002 Configure linting, formatting, and Vitest scripts for the extension in `/Users/ryang/ryang/projects/interview-buddy/browser-extension/package.json`, `/Users/ryang/ryang/projects/interview-buddy/browser-extension/.eslintrc.cjs`, `/Users/ryang/ryang/projects/interview-buddy/browser-extension/.prettierrc`, `/Users/ryang/ryang/projects/interview-buddy/browser-extension/vitest.config.ts` (Depends on: T001)
- [ ] T003 Set up Vite-time mock API layer using MSW with capture handlers in `/Users/ryang/ryang/projects/interview-buddy/browser-extension/src/mocks/browser.ts`, `/Users/ryang/ryang/projects/interview-buddy/browser-extension/src/mocks/handlers.ts`, and wire startup logic in `/Users/ryang/ryang/projects/interview-buddy/browser-extension/src/main.mock.ts` plus update `/Users/ryang/ryang/projects/interview-buddy/browser-extension/package.json` scripts (Depends on: T001, T002)

## Phase 3.2: Tests First (TDD)
- [ ] T004 [P] Create Vitest contract tests for POST `/api/v1/captures` mock behavior (success + duplicate + auth error) in `/Users/ryang/ryang/projects/interview-buddy/browser-extension/tests/unit/api/captureClient.post.contract.spec.ts` referencing `capture-openapi.yaml` (Depends on: T003)
- [ ] T005 [P] Create Vitest contract tests for GET `/api/v1/captures/{id}` mock behavior in `/Users/ryang/ryang/projects/interview-buddy/browser-extension/tests/unit/api/captureClient.get.contract.spec.ts` aligned with `capture-api.md` (Depends on: T003)
- [ ] T006 [P] Translate `capture-api-tests.md` scenarios into Vitest handler tests for rate-limit and payload errors in `/Users/ryang/ryang/projects/interview-buddy/browser-extension/tests/unit/api/captureClient.errors.contract.spec.ts` (Depends on: T003)
- [ ] T007 [P] Author Vitest DOM extraction spec (`extractProblemDetailsFallsBackToUnknown`) at `/Users/ryang/ryang/projects/interview-buddy/browser-extension/tests/unit/content/leetcodeScraper.spec.ts` (Depends on: T003)
- [ ] T008 [P] Author Vitest popup duplicate UI spec (`popupShowsDuplicateErrorFromBackend`) at `/Users/ryang/ryang/projects/interview-buddy/browser-extension/tests/unit/popupDuplicate.spec.ts` (Depends on: T003)
- [ ] T009 [P] Scaffold Playwright E2E spec `pipelineHappyPath` in `/Users/ryang/ryang/projects/interview-buddy/browser-extension/tests/e2e/capture-flow.spec.ts` validating popup → mock API handshake (Depends on: T003)

## Phase 3.3: Core Implementation (run after Phase 3.2 tests exist & fail)
- [ ] T010 [P] Define TypeScript domain types for captures in `/Users/ryang/ryang/projects/interview-buddy/browser-extension/src/types/capture.ts` using `data-model.md` and contracts (Depends on: T004, T005, T006)
- [ ] T011 Implement MSW handlers for capture routes in `/Users/ryang/ryang/projects/interview-buddy/browser-extension/src/mocks/handlers.ts` mirroring contract responses (Depends on: T004, T005, T006)
- [ ] T012 Implement mock bootstrap wiring (start/stop lifecycle) in `/Users/ryang/ryang/projects/interview-buddy/browser-extension/src/mocks/browser.ts` and ensure dev entry point imports it (Depends on: T011)
- [ ] T013 Implement API key storage helper with validation in `/Users/ryang/ryang/projects/interview-buddy/browser-extension/src/storage/apiKeyStore.ts` (Depends on: T007, T008)
- [ ] T014 Implement capture API client with mock-aware fetch wrapper in `/Users/ryang/ryang/projects/interview-buddy/browser-extension/src/api/captureClient.ts` (Depends on: T010, T011, T013)
- [ ] T015 Implement LeetCode content scraper logic (`extractProblemDetails`) in `/Users/ryang/ryang/projects/interview-buddy/browser-extension/src/content/leetcodeScraper.ts` (Depends on: T007, T010)
- [ ] T016 Implement background/service worker orchestration for capture submissions in `/Users/ryang/ryang/projects/interview-buddy/browser-extension/src/background/serviceWorker.ts` (Depends on: T013, T014, T015)
- [ ] T017 Implement popup React UI with success/error and reauth flows in `/Users/ryang/ryang/projects/interview-buddy/browser-extension/src/popup/App.tsx` and `/Users/ryang/ryang/projects/interview-buddy/browser-extension/src/popup/main.tsx` (Depends on: T013, T014, T016)

## Phase 3.4: Integration
- [ ] T018 Wire popup ↔ service worker messaging bridge in `/Users/ryang/ryang/projects/interview-buddy/browser-extension/src/background/serviceWorker.ts` and `/Users/ryang/ryang/projects/interview-buddy/browser-extension/src/popup/hooks/useCapture.ts` (new) (Depends on: T016, T017)
- [ ] T019 Ensure content script → background communication for scraped payload in `/Users/ryang/ryang/projects/interview-buddy/browser-extension/src/content/leetcodeScraper.ts` and `/Users/ryang/ryang/projects/interview-buddy/browser-extension/src/background/serviceWorker.ts` (Depends on: T015, T016)
- [ ] T020 Finalize Vite build config to bundle popup, background, content, and mock loader in `/Users/ryang/ryang/projects/interview-buddy/browser-extension/vite.config.ts` and update `/Users/ryang/ryang/projects/interview-buddy/browser-extension/manifest.json` entries (Depends on: T012, T016, T017)

## Phase 3.5: Polish
- [ ] T021 [P] Add focused unit tests for `apiKeyStore` and popup hooks in `/Users/ryang/ryang/projects/interview-buddy/browser-extension/tests/unit/storage/apiKeyStore.spec.ts` (Depends on: T013, T017)
- [ ] T022 [P] Extend Vitest coverage for service worker event routing in `/Users/ryang/ryang/projects/interview-buddy/browser-extension/tests/unit/background/serviceWorker.spec.ts` (Depends on: T016, T018)
- [ ] T023 [P] Update documentation to note mock API workflow in `/Users/ryang/ryang/projects/interview-buddy/specs/001-create-a-chrome/quickstart.md` and add MSW details to `/Users/ryang/ryang/projects/interview-buddy/AGENTS.md` manual section if required (Depends on: T020)
- [ ] T024 Execute full frontend test matrix (`npm run lint`, `npm run test`, `npm run test:coverage`, Playwright run script) and capture results in `/Users/ryang/ryang/projects/interview-buddy/log/validation.txt` (Depends on: T017, T018, T019, T021, T022)

## Dependencies Overview
- T001 → T002 → T003
- Mock-focused contract tests (T004–T009) require setup complete before implementation (T010–T017)
- T010 enables API client/storage/content logic (T014, T015)
- T016 depends on storage + client + scraper, and gates messaging integrations (T018, T019)
- Vite build + manifest updates (T020) occur after mocks and runtime wiring exist
- Polish tasks execute after integration is stable, culminating in full test run (T024)

## Parallel Execution Examples
```
# After setup, run independent contract/unit specs together
/specify run-task T004
/specify run-task T005
/specify run-task T007
/specify run-task T008

# After implementation, polish tasks in parallel
/specify run-task T021
/specify run-task T022
```

## Validation Checklist
- [x] All contract docs mapped to frontend contract tests (T004, T005, T006)
- [x] Entity mapped to TypeScript types (T010)
- [x] Tests scheduled before implementation tasks
- [x] [P] tasks limited to unique files
- [x] Each task specifies absolute file paths
