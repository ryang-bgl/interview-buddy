# DSA API Endpoints Documentation

## Overview
This document describes the DSA (Data Structures and Algorithms) question API endpoints that have been updated to include tags and related questions from the CSV file.

## API Endpoints

### GET /api/dsa/questions
Returns user's saved DSA questions with additional metadata from CSV.

**Authentication**: Required (JWT token from Supabase)

**Response Format**:
```json
[
  {
    "id": "uuid",
    "userId": "user@email.com",
    "questionIndex": "208",
    "index": "208",
    "title": "Implement Trie (Prefix Tree)",
    "titleSlug": "implement-trie-prefix-tree",
    "difficulty": "Medium",
    "description": "...",
    "solution": null,
    "idealSolutionCode": null,
    "note": null,
    "lastReviewedAt": null,
    "lastReviewStatus": null,
    "reviewIntervalSeconds": null,
    "reviewEaseFactor": null,
    "reviewRepetitions": null,
    "nextReviewDate": "2025-12-09T21:53:46.000Z",
    "createdAt": "...",
    "updatedAt": "...",
    "tags": ["Trie", "Hash Table", "String", "Design"],
    "relatedQuestions": [1032, 425, 648, 211, 2671]
  }
]
```

## Implementation Details

### CSV File Structure
The `dsa_questions_summary.csv` file contains the following columns:
- `index`: Question number
- `title`: Question title
- `slug`: URL-friendly slug
- `tags`: Comma-separated list of tags (quoted)
- `difficulty`: Easy/Medium/Hard
- `related_questions`: Comma-separated list of related question indices

### Data Flow
1. The API reads the CSV file on first request and caches the results
2. For user-specific questions, it merges user data with CSV data
3. Tags are returned as arrays instead of comma-separated strings
4. Related questions are returned as arrays of integers

### New Files Added
- `src/shared/dsaQuestions.ts` - CSV parsing and caching logic

### Modified Files
- `src/functions/dsa/getUserQuestions.ts` - Updated to include tags and relatedQuestions by reading from CSV
- `lib/interview-buddy-api-stack.ts` - No longer includes the /api/dsa/all-questions endpoint (removed)