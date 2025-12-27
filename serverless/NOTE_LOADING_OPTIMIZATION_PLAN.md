# Note Loading Optimization Plan

## Problem Statement

**Current Issue**: The general notes list API returns full card data (front, back, extra) for all notes. When loading the notes list view:
1. `listGeneralNotes()` API is called, returning summaries WITH full cards array
2. Frontend then makes N additional `getGeneralNoteByUrl()` calls to fetch "detailed" data
3. This creates an N+1 query problem and transfers unnecessary data

**Performance Impact**:
- Large payloads: Cards can contain substantial text (front, back, extra fields)
- N+1 queries: Frontend makes 1 + N API calls where N = number of notes
- Slow initial load: All card data transferred even when user just wants to browse notes

## Current Architecture Analysis

### Backend APIs
```
/api/general-note/notes         → listGeneralNotes()
  Returns: { notes: FlashcardNoteSummary[] }
  Issue: Still includes cards array in response

/api/general-note/note?url=X    → getGeneralNoteByUrl()
  Returns: FlashcardNoteRecord (with cards)
```

### Frontend Data Flow (NotebookStore.ts:142-196)
```typescript
async loadNotes() {
  // 1. Fetch all summaries (includes cards!)
  const { notes: summaries } = await listGeneralNotes();

  // 2. N+1: Fetch full details for EACH note
  const detailed = await Promise.all(
    summaries.map(async (summary) => {
      return await getGeneralNoteByUrl(summary.url);
    })
  );
}
```

### Type Definitions (api.ts)
```typescript
// Currently used for both list and detail
FlashcardNoteSummary {
  cardCount: number;        // Computed from cards array
  tags: string[];           // Computed from cards array
  ...summary fields
}

FlashcardNoteRecord {
  cards: FlashcardCardRecord[];  // Full card data
  ...summary fields
}
```

## Proposed Solution

### API Changes

#### 1. Lightweight List API (Modified)
**Endpoint**: `GET /api/general-note/notes`

**Changes**:
- Remove `cards` from projection/expression
- Keep existing summary fields
- Return computed `cardCount` and `tags` from DynamoDB

**Response**:
```typescript
{
  notes: FlashcardNoteSummary[]  // No cards array
}

FlashcardNoteSummary {
  noteId: string;
  url: string;
  topic: string | null;
  summary: string | null;
  createdAt: string;
  lastReviewedAt: string | null;
  lastReviewStatus: "easy" | "good" | "hard" | null;
  cardCount: number;           // Stored/computed field
  tags: string[];              // Stored/computed field
  reviewIntervalSeconds?: number | null;
  reviewEaseFactor?: number | null;
  reviewRepetitions?: number | null;
  nextReviewDate?: string | null;
}
```

#### 2. New Note Detail API
**Endpoint**: `GET /api/general-note/notes/{noteId}`

**Purpose**: Fetch full note data including cards for detail/edit/review views

**Response**:
```typescript
FlashcardNoteDetail {
  noteId: string;
  url: string;
  topic: string | null;
  summary: string | null;
  cards: FlashcardCardRecord[];  // Full card data
  createdAt: string;
  lastReviewedAt: string | null;
  lastReviewStatus: "easy" | "good" | "hard" | null;
  reviewIntervalSeconds?: number | null;
  reviewEaseFactor?: number | null;
  reviewRepetitions?: number | null;
  nextReviewDate?: string | null;
}
```

### Backend Implementation Plan

#### Step 1: Modify `listGeneralNotes` Lambda
**File**: `serverless/src/functions/notes/listGeneralNotes.ts`

**Changes**:
```typescript
// Current ProjectionExpression (line 62-63):
"noteId, sourceUrl, topic, summary, cards, createdAt, ..."

// New ProjectionExpression:
"noteId, sourceUrl, topic, summary, cardCount, tags, createdAt, ..."

// Note: cardCount and tags need to be stored in DynamoDB
// OR computed from cards during write operations
```

**Option A**: Store computed fields (recommended)
- Add `cardCount` and `tags` to UserNoteRecord type
- Update when notes are created/updated
- Fast queries, no computation needed

**Option B**: Compute on read
- Remove `cards` from projection
- Compute cardCount and tags from cards array
- Still fetches cards but doesn't return them

**Recommendation**: Option A for best performance

#### Step 2: Create `getGeneralNoteById` Lambda
**File**: `serverless/src/functions/notes/getGeneralNoteById.ts` (new)

**Implementation**:
```typescript
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const { noteId } = event.pathParameters;

  const query = new QueryCommand({
    TableName: userNotesTableName,
    KeyConditionExpression: "userId = :userId AND noteId = :noteId",
    ExpressionAttributeValues: {
      ":userId": userId,
      ":noteId": noteId,
    },
  });

  const note = result.Items[0] as UserNoteRecord;

  return jsonResponse(200, {
    noteId: note.noteId,
    url: note.sourceUrl,
    topic: note.topic ?? null,
    summary: note.summary ?? null,
    cards: note.cards ?? [],  // Full card data
    // ... other fields
  });
};
```

#### Step 3: Update CDK Stack
**File**: `serverless/lib/interview-buddy-api-stack.ts`

**Add Route**:
```typescript
// New endpoint for fetching note by ID
const getGeneralNoteByIdLambda = new NodejsFunction(
  this, "GetGeneralNoteByIdFn",
  { entry: "./src/functions/notes/getGeneralNoteById.ts" }
);

// Add route: GET /api/general-note/notes/{noteId}
```

### Frontend Implementation Plan

#### Step 4: Update Type Definitions
**File**: `web-app/src/lib/api.ts`

**Add new type**:
```typescript
export interface FlashcardNoteDetail {
  noteId: string;
  url: string;
  topic: string | null;
  summary: string | null;
  cards: FlashcardCardRecord[];  // Full cards
  createdAt: string;
  lastReviewedAt: string | null;
  lastReviewStatus: "easy" | "good" | "hard" | null;
  reviewIntervalSeconds?: number | null;
  reviewEaseFactor?: number | null;
  reviewRepetitions?: number | null;
  nextReviewDate?: string | null;
}
```

**Add new API function**:
```typescript
export async function getGeneralNoteById(noteId: string) {
  const encoded = encodeURIComponent(noteId);
  return request<FlashcardNoteDetail>(
    `/api/general-note/notes/${encoded}`
  );
}
```

#### Step 5: Update NotebookStore
**File**: `web-app/src/features/notebook/NotebookStore.ts`

**Current flow** (lines 142-196):
```typescript
async loadNotes() {
  const { notes: summaries } = await listGeneralNotes();
  const detailed = await Promise.all(
    summaries.map(async (summary) => {
      return await getGeneralNoteByUrl(summary.url);  // N+1!
    })
  );
}
```

**New optimized flow**:
```typescript
async loadNotes() {
  // Only load summaries (no cards)
  const { notes: summaries } = await listGeneralNotes();

  // Map summaries directly to store
  const notes: NotebookNote[] = summaries.map((summary) => ({
    ...summary,
    cards: [],  // Empty initially
  }));

  runInAction(() => {
    this.notes = notes;
    this.hasLoadedNotes = true;
  });
}

// New method to load note detail on-demand
async loadNoteDetail(noteId: string) {
  const existing = this.getNoteById(noteId);

  // Already loaded?
  if (existing && existing.cards.length > 0) {
    return existing;
  }

  // Fetch detail with cards
  const detail = await getGeneralNoteById(noteId);

  runInAction(() => {
    const note = this.getNoteById(noteId);
    if (note) {
      note.cards = detail.cards.map((card, index) =>
        createNotebookFlashcard(noteId, card, index)
      );
    }
  });

  return this.getNoteById(noteId);
}
```

#### Step 6: Update Views
**Files**:
- `web-app/src/features/notes/NotesView.tsx` (list view)
- `web-app/src/features/notes/NoteDetailView.tsx` (detail view)
- `web-app/src/features/notes/NoteReviewView.tsx` (review view)

**Changes**:
- **NotesView**: No changes needed (already uses summaries)
- **NoteDetailView**: Call `loadNoteDetail(noteId)` when entering
- **NoteReviewView**: Call `loadNoteDetail(noteId)` when entering

### Database Schema Considerations

#### Option A: Add Computed Fields (Recommended)
Add to `UserNoteRecord`:
```typescript
export interface UserNoteRecord {
  userId: string;
  noteId: string | null;
  sourceUrl: string;
  topic?: string;
  summary?: string;
  cards: UserNoteCardRecord[];

  // NEW: Computed fields
  cardCount?: number;    // Update when cards change
  tags?: string[];       // Aggregated from cards

  createdAt?: string;
  updatedAt?: string;
  // ... review fields
}
```

**Migration needed**: Update existing notes to include `cardCount` and `tags`

#### Option B: Compute on Read
No schema changes, but:
- Still need to fetch cards to compute count/tags
- Can't remove cards from projection
- Less optimal performance

## Implementation Sequence

### Phase 1: Backend API Changes
1. Modify `listGeneralNotes` to return summaries only
2. Create `getGeneralNoteById` Lambda
3. Update CDK stack with new route
4. Deploy and test APIs

### Phase 2: Frontend API Integration
5. Add `FlashcardNoteDetail` type to api.ts
6. Add `getGeneralNoteById` function to api.ts
7. Update NotebookStore with optimized loading
8. Add `loadNoteDetail` method for lazy loading

### Phase 3: Frontend View Updates
9. Update NoteDetailView to call `loadNoteDetail`
10. Update NoteReviewView to call `loadNoteDetail`
11. Test user flows (list → detail → review)

### Phase 4: Database Optimization (Optional)
12. Add `cardCount` and `tags` to schema
13. Create migration script
14. Update note creation/update logic
15. Deploy and verify

## Performance Benefits

### Before Optimization
```
List View Load (10 notes):
- 1 API call: listGeneralNotes → ~50KB (includes all cards)
- 10 API calls: getGeneralNoteByUrl → ~500KB total
- Total: 11 requests, ~550KB, ~2-3 seconds
```

### After Optimization
```
List View Load (10 notes):
- 1 API call: listGeneralNotes → ~5KB (summaries only)
- Total: 1 request, ~5KB, ~200-300ms

Detail View Load (1 note):
- 1 API call: getGeneralNoteById → ~10KB (one note + cards)
- Total: 1 request, ~10KB, ~200-300ms
```

**Improvement**:
- 91% reduction in data transfer for list view
- 10x reduction in API calls for list view
- 5-10x faster initial page load
- Better scalability as notes grow

## Backward Compatibility

### Breaking Changes
- `listGeneralNotes()` response will no longer include `cards` array
- Frontend must be updated before or with backend deployment

### Migration Strategy
1. Deploy backend with new APIs
2. Keep old API endpoint temporarily with version suffix
3. Update frontend to use new APIs
4. Deprecate old endpoint after verification

## Testing Checklist

### Backend Tests
- [ ] `listGeneralNotes` returns summaries without cards
- [ ] `listGeneralNotes` returns correct cardCount
- [ ] `listGeneralNotes` returns correct tags array
- [ ] `getGeneralNoteById` returns full note with cards
- [ ] `getGeneralNoteById` handles non-existent noteId
- [ ] Authentication works for both endpoints

### Frontend Tests
- [ ] Notes list loads without errors
- [ ] Note detail loads cards when viewed
- [ ] Note review loads cards when started
- [ ] Card editing still works
- [ ] Review grading still works

### Integration Tests
- [ ] End-to-end: List → Detail → Review flow
- [ ] Multiple users data isolation
- [ ] Large note sets (50+ notes)
- [ ] Network error handling

## Rollback Plan

If issues arise:
1. Revert CDK stack to previous version
2. Restore old `listGeneralNotes` implementation
3. Revert frontend changes
4. Investigate and fix issues
5. Re-deploy with fixes

## Future Enhancements

1. **Pagination**: Add cursor-based pagination for note lists
2. **Caching**: Cache summaries in frontend state
3. **WebSocket**: Real-time updates for note changes
4. **Bulk Operations**: Batch note detail fetching for offline support
