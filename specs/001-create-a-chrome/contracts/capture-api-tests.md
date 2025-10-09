# Contract Test Plan: Capture API

## Spring MockMvc Scenarios (Failing until implementation)
1. **shouldReturn201WhenValidCapturePosted**
   - Arrange: valid `CaptureRequest` JSON, header `X-IB-API-Key` mapped to active key.
   - Assert: 201 status, response body matches `CaptureResponse` schema, `duplicate=false`.
   - TODO: Fails until controller/service/persistence exist.
2. **shouldReturn409WhenDuplicateCaptureSubmitted**
   - Arrange: seed `ProblemCapture` for (userId, slug), then POST identical request.
   - Assert: 409 status, body conforms to `DuplicateResponse`, includes `existingCaptureId`.
3. **shouldReturn401WhenApiKeyMissingOrRevoked**
   - Arrange: POST without key or with revoked key fixture.
   - Assert: 401 status, body matches `ErrorResponse` with `code=AUTH_401`.
4. **shouldReturn413WhenPayloadExceedsLimit**
   - Arrange: Build request with >1 MB combined size.
   - Assert: 413 status, body matches `ErrorResponse` with `code=PAYLOAD_413`.
5. **shouldReturn429WhenRateLimitExceeded**
   - Arrange: Simulate >30 requests/minute for same user.
   - Assert: 429 status, body matches `ErrorResponse` with `code=RATE_LIMIT_429`.

## Extension Vitest Scenarios (Failing until implementation)
1. **extractProblemDetailsFallsBackToUnknown**
   - Mock DOM lacking statement text → expect extractor to return `"unknown"` placeholders and set `partial=true`.
2. **popupShowsDuplicateErrorFromBackend**
   - Mock fetch response 409 → ensure UI surfaces duplicate message and link to dashboard.

## Playwright E2E Skeleton (Pending)
- **pipelineHappyPath**: Launch headless Chrome with extension loaded, navigate to LeetCode fixture page, trigger capture, assert success toast and backend receives request (requires local server stub).
