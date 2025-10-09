# Feature Specification: Save LeetCode Problems from Chrome Extension

**Feature Branch**: `001-create-a-chrome`  
**Created**: 2025-10-06  
**Status**: Draft  
**Input**: User description: "create a chrome browser extension to allow the user to save a leetcode problem to my website backend. so the user can review that problem later in my backend. it should save the leetcode problem statement, link, users solution, and optionally users note about the problem"

## Execution Flow (main)
```
1. User installs and enables the Chrome extension while signed in to the Interview Buddy backend
   → User pastes a personal API key from Interview Buddy account settings to authenticate the extension with the backend.
2. User opens a LeetCode problem page they wish to capture
   → Extension detects problem metadata (title, link, difficulty, tags if visible); if data is missing, required fields are marked as "unknown" before submission
3. User invokes the extension action (e.g., toolbar icon or inline button)
   → Extension displays preview with detected data and fields for user solution + optional notes
4. User confirms save request
   → Extension sends structured payload to backend and provides immediate feedback on success/failure
5. User later visits backend dashboard to review saved problems
   → Saved entry shows problem statement summary, link, stored solution, and notes
```

---

## ⚡ Quick Guidelines
- Prioritize a frictionless capture flow directly from an active LeetCode session
- Make saved problem entries easy to review later from the backend interface
- Surface optional fields (notes) without making them mandatory or intrusive
- Respect user privacy by exposing only the data required for review and clarifying retention expectations; saved captures persist indefinitely until the user manually deletes them.

---

## Clarifications

### Session 2025-10-06

- Q: If the user’s Interview Buddy session has expired when they try to save, how should the extension respond? → A: Show inline error with Reauthenticate button.
- Q: How long should saved LeetCode captures remain in the backend before deletion? → A: Retain indefinitely until user deletes.
- Q: How should the extension handle cases where it can’t automatically scrape required problem details from the LeetCode page? → A: Send partial payload with unknown fields.
- Q: How should the system handle repeated saves of the same LeetCode problem by the same user? → A: Block duplicate saves and notify user.
- Q: How should the Chrome extension authenticate each save request with the Interview Buddy backend? → A: Users paste a personal API key.

## User Scenarios & Testing *(mandatory)*

### Primary User Story
A practicing candidate signed in to Interview Buddy wants to save the details of an in-progress LeetCode problem (statement, link, their current solution draft, plus personal notes) so they can revisit it later in the Interview Buddy web app.

### Acceptance Scenarios
1. **Given** a signed-in user on a LeetCode problem page, **When** they trigger the extension capture and confirm, **Then** the backend stores the problem statement, canonical link, user-provided solution text, optional notes, and acknowledges completion to the user.
2. **Given** the backend cannot complete the save (e.g., missing auth or network error), **When** the user attempts to capture a problem, **Then** the extension clearly explains the failure cause and guides the user to retry or reauthenticate.

### Edge Cases
- If the extension cannot parse required data, it sends the save request with those fields marked as "unknown" so the backend stores a partial capture.
- Duplicate save attempts for the same problem by the same user are blocked with an explanation that the problem is already captured.
- If the user's API key has expired or been revoked, the extension shows an inline error with a "Reauthenticate" button that opens the API key management view so the user can paste a fresh key. The save is not queued until reauthentication succeeds.

## Requirements *(mandatory)*

### Functional Requirements

### Data Retention
- Saved captures remain in the backend indefinitely until the user manually deletes them.
- **FR-001**: The system MUST require users to paste a personal API key generated in Interview Buddy account settings to authenticate the Chrome extension before saving problems; the extension MUST include this key with each save request.
- **FR-002**: The extension MUST collect the LeetCode problem title, canonical URL, visible difficulty/metadata, full statement text, and the timestamp of capture when available, marking any unparseable fields as "unknown" for the backend to record explicitly.
- **FR-003**: Users MUST be able to input or paste their solution code in a free-form text area before submitting the save request.
- **FR-004**: The extension MUST provide an optional notes field that is saved alongside the problem data when supplied.
- **FR-005**: The system MUST send the capture payload to the backend and display success confirmation when the backend acknowledges receipt.
- **FR-006**: The system MUST handle backend or network errors by showing actionable messaging (including an inline "Reauthenticate" button when the API key is invalid or expired) and preventing users from assuming the save succeeded.
- **FR-007**: The backend MUST expose saved problems in the user's review area with the captured problem statement, link, solution, notes, and capture timestamp.
- **FR-008**: The system MUST restrict saved problems to the owning user: personal API keys hash to a single account, cross-user or team access is disallowed, and the backend MUST reject requests signed with keys not registered to that user.
- **FR-009**: The system MUST block duplicate saves of the same problem for a user and display a clear "problem already captured" message.

### Key Entities *(include if feature involves data)*
- **LeetCode Problem Capture**: Represents a saved problem instance containing problem metadata (title, link, difficulty, tags if available), full statement text, user solution snapshot, optional notes, capture timestamp, and owning user identifier.
- **Capture Submission**: The request/response interaction between extension and backend, including the user-provided personal API key, a maximum payload size of 1 MB, the curated solution language set (`java`, `python`, `cpp`, `javascript`, `typescript`, `go`, `rust`, `ruby`, `swift`, `kotlin`, `csharp`, `other`), and error codes surfaced to the user.

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed

---
