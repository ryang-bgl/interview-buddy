# Quickstart – Save LeetCode Problems from Chrome Extension

## Prerequisites
- Java 21 with Gradle wrapper (`./gradlew`)
- Node.js 20.x and npm 10+
- Google Chrome 128+
- MySQL instance reachable at `mysql://localhost:3306/interview_buddy` (or matching existing dev configuration)

## Backend Setup
1. `cd /Users/ryang/ryang/projects/interview-buddy/server`
2. `./gradlew clean bootRun`
   - Uses Spring Boot 3.2.2; binds to `http://localhost:8080`
3. Ensure database migrations run; initial schema should include new `leetcode_capture` table once implemented.
4. Generate a personal API key for a test user (reuse existing admin endpoint or seed data). Record the key for extension testing.

## Chrome Extension Setup
1. `cd /Users/ryang/ryang/projects/interview-buddy/browser-extension`
2. `npm install`
3. `npm run dev`
   - Produces build output in `dist/` with HMR for popup frames; service worker reloaded on rebuild.
4. In Chrome, open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select `/Users/ryang/ryang/projects/interview-buddy/browser-extension/dist`.
5. In the extension popup, paste the personal API key when prompted.

## End-to-End Verification
1. Open any LeetCode problem page (e.g., `https://leetcode.com/problems/two-sum/`).
2. Click the Interview Buddy browser action.
3. Confirm scraped fields populate. Fill in solution snippet and optional notes.
4. Submit capture; expect success toast in popup.
5. Check backend logs for `LeetCodeProblemCaptureService` entries and verify record persisted via MySQL shell: `SELECT problem_title, captured_at FROM leetcode_capture ORDER BY captured_at DESC LIMIT 1;`
6. Trigger duplicate submission to confirm "problem already captured" error path.
7. Revoke API key (simulate via DB update) and attempt submission; extension should show inline reauthenticate button.

## Troubleshooting
- **401 Unauthorized**: Verify API key is valid; check backend authentication logs.
- **413 Payload Too Large**: Ensure solution snippet under 1 MB.
- **Content script missing data**: Use popup debug inspector and capture fallback prompts; confirm DOM selectors in `src/content/leetcode.ts` cover new layout.

