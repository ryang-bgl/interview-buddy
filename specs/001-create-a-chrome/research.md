# Phase 0 Research – Save LeetCode Problems from Chrome Extension

## Decision: MV3 extension architecture with service worker + content scripts
- **Rationale**: MV3 service workers handle network I/O securely and persist across popup lifecycle. Content scripts can scrape DOM with least privilege, while the popup provides the capture UI. This separation aligns with Chrome guidance and keeps the popup lightweight.
- **Alternatives considered**:
  - *Background page (MV2)*: Unsupported for new submissions; MV3 requires service workers.
  - *Popup-only scraping*: Popup loses context when closed; cannot listen for tab updates or long-running auth state.

## Decision: Capture flow uses content script extraction with fallback prompts
- **Rationale**: LeetCode exposes problem information in the DOM and meta tags; content scripts can query selectors for title, difficulty labels, and description container. When selectors fail, prompt user to paste missing fields while marking them `unknown` to satisfy FR-002.
- **Alternatives considered**:
  - *Leverage LeetCode API*: Requires authentication to LeetCode APIs and violates ToS; unnecessary complexity.
  - *Backend scraping*: Adds latency and duplicates browser context; extension already has access.

## Decision: Store personal API key in `chrome.storage.local` with reauthentication UX
- **Rationale**: `chrome.storage.local` keeps data scoped to the extension, persists across sessions, and is recommended for small secrets. Service worker can inject key into fetch calls and detect 401 to surface "Reauthenticate" inline prompt per clarifications.
- **Alternatives considered**:
  - *Session storage in popup state*: Loses key on popup close, forcing repeated entry.
  - *Sync storage*: Risk of syncing sensitive keys across devices without encryption; violates principle of least privilege.

## Decision: Backend contract – `POST /api/v1/captures` with idempotency hash
- **Rationale**: Single endpoint for capture simplifies extension integration. Duplicate detection handled via hash `(userId + problemSlug)` and enforced via UNIQUE index; aligns with FR-009. Response returns capture id and status for UI feedback.
- **Alternatives considered**:
  - *Multiple resources (problem, notes, solution)*: Adds complexity; spec favors atomic capture submission.
  - *Client-side duplicate check*: Loses authoritative backend enforcement and complicates offline scenarios.

## Decision: Data persistence via jOOQ-backed table `leetcode_capture`
- **Rationale**: MySQL with jOOQ is existing stack. Table stores metadata (title, url, difficulty, statement, solution, notes, capture timestamp, user id, language, payload checksum). This keeps backend consistent with current architecture and supports FR-007/FR-008.
- **Alternatives considered**:
  - *Document store*: Not part of tech stack; adds operational overhead.
  - *Reuse generic notes table*: Would require polymorphic mapping and breaks domain-specific constraints (duplicate blocking, required metadata).

## Decision: Payload validation and size enforcement in backend service layer
- **Rationale**: Spec demands max payload size 1 MB. Server verifies request size and rejects with 413 if larger, returning actionable error to extension (FR-006). Implementation via Spring Boot filter or service-level check; ensures consistent enforcement even if extension misbehaves.
- **Alternatives considered**:
  - *Client-side only enforcement*: Risk of bypass; backend must guard resource usage.
  - *Database constraint alone*: Blobs trimmed silently; fails to give user feedback.

## Decision: Quickstart focuses on parallel local dev of extension + server
- **Rationale**: Developers need reproducible steps to run Spring Boot API and load unpacked MV3 extension. Quickstart documents commands (`./gradlew bootRun`, `npm install && npm run dev` once scaffolding exists) plus sample `.env.local` with API base URL.
- **Alternatives considered**:
  - *Backend-only quickstart*: Leaves extension developers guessing about bundler and manifest setup.
  - *Extension-only quickstart*: Ignores need for reachable backend and API key provisioning.
