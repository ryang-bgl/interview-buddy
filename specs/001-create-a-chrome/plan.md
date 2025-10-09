# Implementation Plan: Save LeetCode Problems from Chrome Extension

**Branch**: `001-create-a-chrome` | **Date**: 2025-10-07 | **Spec**: `/Users/ryang/ryang/projects/interview-buddy/specs/001-create-a-chrome/spec.md`
**Input**: Feature specification from `/Users/ryang/ryang/projects/interview-buddy/specs/001-create-a-chrome/spec.md`

## Execution Flow (/plan command scope)
```
1. Loaded feature spec and clarifications
2. Filled Technical Context using spec + repo conventions (no user arguments provided)
3. Reviewed constitution file – placeholder only; no binding principles
4. Recorded Initial Constitution Check (PASS)
5. Completed Phase 0 research → `/Users/ryang/ryang/projects/interview-buddy/specs/001-create-a-chrome/research.md`
6. Completed Phase 1 design artifacts → data-model, contracts, quickstart, failing contract tests, agent context update
7. Re-ran Constitution Check after design adjustments (PASS)
8. Documented Phase 2 task planning approach (to be executed by `/tasks` command later)
9. Stopped – ready for `/tasks`
```

## Summary
- Deliver MV3 Chrome extension that captures LeetCode problem metadata, solution draft, and optional notes, then posts to Interview Buddy backend using personal API key auth.
- Extend Spring Boot backend with `POST /api/v1/captures` endpoint, duplicate detection, payload validation, and storage via jOOQ-backed `leetcode_capture` table.
- Provide failure handling (reauthenticate, validation errors, payload size limit) and ensure saved captures remain reviewable indefinitely per requirements.

## Technical Context
**Language/Version**: TypeScript 5.x (Chrome MV3) + Java 21 (Spring Boot 3.2.2)  
**Primary Dependencies**: Chrome Extensions API, React/TypeScript toolkit for popup UI, Spring Boot Web/Security, jOOQ, MySQL  
**Storage**: MySQL (existing Interview Buddy schema) via jOOQ mappings  
**Testing**: npm test (Jest/React Testing Library) for extension, JUnit 5 + Spring MockMvc for backend contracts  
**Target Platform**: Chrome desktop MV3 extension + Spring Boot service at `http://localhost:8080`  
**Project Type**: web (browser extension + Java backend)  
**Performance Goals**: Capture round-trip under ~2s, duplicate checks O(1) via indexed lookup, payload capped at 1 MB  
**Constraints**: Enforce API key auth, reject duplicates, handle partial scrapes gracefully, maintain GDPR-friendly retention (user-driven deletion)  
**Scale/Scope**: Single-user captures, hundreds of problems per user, low concurrency but must be multi-tenant safe  
**Additional User Input**: none provided via $ARGUMENTS

## Constitution Check
- The constitution file is a placeholder with no actionable principles; no violations detected.
- Initial Constitution Check: PASS  
- Post-Design Constitution Check: PASS  
- No complexity deviations recorded.

## Project Structure

### Documentation (this feature)
```
specs/001-create-a-chrome/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── capture-openapi.yaml
└── tasks.md  (generated later by `/tasks`)
```

### Source Code (repository root)
```
browser-extension/
├── package.json               # to be introduced for MV3 toolchain
├── tsconfig.json
├── manifest.json
├── src/
│   ├── background/serviceWorker.ts
│   ├── content/leetcodeScraper.ts
│   ├── popup/App.tsx
│   ├── api/captureClient.ts
│   └── storage/apiKeyStore.ts
└── tests/
    └── unit/

server/
├── src/main/java/com/litdeck/backend/capture/
│   ├── controller/
│   ├── dto/
│   ├── mapper/
│   ├── service/
│   └── repository/
├── src/main/resources/db/migration/
└── src/test/java/com/litdeck/backend/capture/
```

**Structure Decision**: Treat project as multi-component web platform; add capture-focused packages under Spring Boot server and scaffold MV3 extension under `browser-extension/` with React popup and shared API client.

## Phase 0: Outline & Research
- Identified MV3 architecture, data extraction, API key storage, backend contract, jOOQ persistence, payload enforcement, and quickstart requirements.  
- Consolidated findings in `/Users/ryang/ryang/projects/interview-buddy/specs/001-create-a-chrome/research.md` with decisions, rationales, and alternatives.

## Phase 1: Design & Contracts
- Documented domain entities and DTOs in `/Users/ryang/ryang/projects/interview-buddy/specs/001-create-a-chrome/data-model.md`.
- Authored OpenAPI contract at `/Users/ryang/ryang/projects/interview-buddy/specs/001-create-a-chrome/contracts/capture-openapi.yaml` covering success, duplicate, auth, validation, and rate-limit scenarios.
- Added failing JUnit contract tests in `/Users/ryang/ryang/projects/interview-buddy/server/src/test/java/com/litdeck/backend/capture/CaptureApiContractTest.java` to drive future implementation.
- Captured onboarding flow in `/Users/ryang/ryang/projects/interview-buddy/specs/001-create-a-chrome/quickstart.md` for parallel backend/extension setup.
- Ran `.specify/scripts/bash/update-agent-context.sh codex` to register new technologies with Codex CLI context.

## Phase 2: Task Planning Approach
- `/tasks` will load `.specify/templates/tasks-template.md` and derive tasks from data-model, contracts, and quickstart.
- Expected task groups:
  1. Extend database schema and jOOQ mappings (migration + generated code).
  2. Implement backend contract tests then REST controller/service/repository wiring to satisfy OpenAPI spec.
  3. Build extension scaffold (manifest, build tooling) and popup UI with validation states.
  4. Implement content script scraping + fallback prompts and API client integration with personal API key storage.
  5. Add end-to-end integration tests (MockMvc + extension UI tests) before implementation tasks pass.
- Tasks marked `[P]` when independent (e.g., frontend popup UI vs backend migration) to allow parallel execution while respecting TDD ordering.

## Phase 3+: Future Implementation
- Phase 3: `/tasks` command generates `tasks.md` (not executed yet).
- Phase 4: Implement tasks ensuring contract tests move from failing to passing.
- Phase 5: Validate using backend tests, extension unit tests, and manual quickstart walkthrough.

## Complexity Tracking
*No deviations – table intentionally left blank.*

## Progress Tracking
**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented (not required)

---
Based on Constitution placeholder at `/Users/ryang/ryang/projects/interview-buddy/.specify/memory/constitution.md`
