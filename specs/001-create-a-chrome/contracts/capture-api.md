# Contracts: Capture API

```yaml
openapi: 3.1.0
info:
  title: Interview Buddy Capture API
  version: 0.1.0
paths:
  /api/v1/captures:
    post:
      summary: Ingest a LeetCode problem capture from the Chrome extension
      security:
        - PersonalApiKey: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CaptureRequest'
            examples:
              success:
                summary: Valid capture
                value:
                  sourceSlug: two-sum
                  sourceTitle: Two Sum
                  sourceUrl: https://leetcode.com/problems/two-sum
                  difficulty: medium
                  tags: [array, hash-table]
                  statementHtml: "<p>Given an array...</p>"
                  solutionLanguage: javascript
                  solutionText: |
                    const twoSum = (nums, target) => { /* ... */ };
                  notes: "Need to revisit time complexity"
                  capturedAt: "2025-10-06T19:23:00Z"
                  heuristicFlags:
                    partial: false
              partial:
                summary: Partial capture with unknowns
                value:
                  sourceSlug: lru-cache
                  sourceTitle: LRU Cache
                  sourceUrl: https://leetcode.com/problems/lru-cache
                  difficulty: unknown
                  tags: []
                  statementHtml: "unknown"
                  solutionLanguage: other
                  solutionText: "unknown"
                  notes: "unknown"
                  capturedAt: "2025-10-06T20:15:00Z"
                  heuristicFlags:
                    partial: true
      responses:
        '201':
          description: Capture stored successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CaptureResponse'
              examples:
                success:
                  value:
                    id: 3f40a4b7-5df7-4b37-a8dc-2ce41268b7aa
                    duplicate: false
                    dashboardUrl: https://app.interviewbuddy.io/captures/3f40a4b7-5df7-4b37-a8dc-2ce41268b7aa
        '401':
          description: API key missing, expired, or revoked
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              examples:
                authFailed:
                  value:
                    code: AUTH_401
                    message: "API key invalid or expired. Use Reauthenticate to paste a fresh key."
        '409':
          description: Duplicate capture for user/slug pair
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DuplicateResponse'
              examples:
                duplicate:
                  value:
                    code: DUPLICATE_409
                    message: "This problem is already saved. View it in your dashboard."
                    existingCaptureId: 3f40a4b7-5df7-4b37-a8dc-2ce41268b7aa
        '413':
          description: Payload exceeds 1 MB limit
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              examples:
                payloadTooLarge:
                  value:
                    code: PAYLOAD_413
                    message: "Capture payload exceeds 1 MB. Trim your solution or notes and retry."
        '429':
          description: Rate limit exceeded
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              examples:
                throttled:
                  value:
                    code: RATE_LIMIT_429
                    message: "Too many captures in a short time. Please retry after 60 seconds."

  /api/v1/captures/{id}:
    get:
      summary: Retrieve a stored capture for confirmation
      security:
        - PersonalApiKey: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Capture details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CaptureResponse'
        '404':
          description: Capture not found for this user
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

components:
  securitySchemes:
    PersonalApiKey:
      type: apiKey
      in: header
      name: X-IB-API-Key
  schemas:
    CaptureRequest:
      type: object
      required:
        - sourceSlug
        - sourceTitle
        - sourceUrl
        - difficulty
        - statementHtml
        - solutionLanguage
        - solutionText
        - capturedAt
      properties:
        sourceSlug:
          type: string
          pattern: '^[a-z0-9-]+$'
        sourceTitle:
          type: string
          maxLength: 255
        sourceUrl:
          type: string
          format: uri
        difficulty:
          type: string
          enum: [easy, medium, hard, unknown]
        tags:
          type: array
          items:
            type: string
        statementHtml:
          type: string
          maxLength: 256000
        solutionLanguage:
          type: string
          enum: [java, python, cpp, javascript, typescript, go, rust, ruby, swift, kotlin, csharp, other]
        solutionText:
          type: string
          maxLength: 512000
        notes:
          type: string
          maxLength: 256000
        capturedAt:
          type: string
          format: date-time
        heuristicFlags:
          type: object
          additionalProperties: true
    CaptureResponse:
      type: object
      required:
        - id
        - duplicate
        - dashboardUrl
      properties:
        id:
          type: string
          format: uuid
        duplicate:
          type: boolean
        dashboardUrl:
          type: string
          format: uri
    DuplicateResponse:
      allOf:
        - $ref: '#/components/schemas/ErrorResponse'
        - type: object
          required:
            - existingCaptureId
          properties:
            existingCaptureId:
              type: string
              format: uuid
    ErrorResponse:
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: string
        message:
          type: string
```
