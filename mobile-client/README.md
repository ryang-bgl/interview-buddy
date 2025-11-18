# LeetCode Review App

A React Native app built with Expo Router that helps you review your LeetCode solutions using spaced repetition (FSR - Forgetting Spaced Repetition) algorithm based on the brain's natural forgetting curve.

## Features

- **Spaced Repetition Algorithm**: Uses FSR (based on SuperMemo SM-2) to optimize review scheduling
- **Cross-Platform**: Works on both iOS and Android
- **Local Storage**: Solutions stored locally with AsyncStorage
- **API Integration**: Sync with external server for backup and cross-device sync
- **Progress Tracking**: Detailed statistics and learning progress
- **Review Interface**: Clean, intuitive interface for reviewing solutions

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd leetcode-reviewer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your API server URL
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Run on your preferred platform:
   ```bash
   # iOS
   npm run ios

   # Android
   npm run android

   # Web
   npm run web
   ```

   > In development builds the app automatically signs in with mock credentials, letting you load the main tabs without completing Firebase login. Set `EXPO_PUBLIC_USE_MOCK_AUTH=false` in your `.env` if you need to exercise the real auth screens locally.

## Project Structure

```
leetcode-reviewer/
├── app/                    # App screens and navigation
│   ├── (tabs)/            # Tab-based screens
│   │   ├── index.tsx      # Review screen
│   │   ├── solutions.tsx  # Solutions list
│   │   └── profile.tsx    # Profile and stats
│   └── _layout.tsx        # Root layout
├── services/              # API integration
│   └── api.ts            # API client and utilities
├── types/                 # TypeScript type definitions
│   └── solution.ts       # Solution and review types
├── utils/                 # Utility functions
│   └── fsrScheduler.ts   # FSR algorithm implementation
└── components/           # Reusable components
```

## How It Works

### Spaced Repetition (FSR)

The app uses the FSR algorithm to determine when you should review each solution:

1. **Initial Review**: New solutions are scheduled for review the next day
2. **Difficulty Assessment**: After each review, you rate the difficulty:
   - **Easy**: You remembered it perfectly
   - **Medium**: You remembered with some difficulty
   - **Hard**: You struggled to remember or forgot

3. **Adaptive Scheduling**: Based on your assessment:
   - Easy responses increase the interval significantly
   - Medium responses increase the interval moderately
   - Hard responses reset or minimally increase the interval

4. **Ease Factor**: Each solution has an ease factor that adjusts based on your performance, making the algorithm more personalized over time

### Key Features

- **Review Screen**: Shows solutions due for review with code and problem details
- **Solutions List**: Displays all your solutions with scheduling information
- **Progress Tracking**: Statistics on reviews, streaks, and learning progress
- **API Sync**: Optional integration with external server for data backup

## API Integration

The app is designed to work with a separate API server for:

- User authentication
- Solution backup and sync
- Cross-device data sharing
- Advanced analytics

### API Endpoints Expected

```
POST /api/auth/login
POST /api/auth/register
GET  /api/solutions
POST /api/solutions
PUT  /api/solutions/:id
DELETE /api/solutions/:id
POST /api/sync
GET  /api/user/stats
GET  /api/health
```

## Configuration

### Environment Variables

- `EXPO_PUBLIC_API_URL`: Base URL for your API server
- `EXPO_PUBLIC_ENVIRONMENT`: Environment (development/production)
- `EXPO_PUBLIC_USE_MOCK_AUTH`: Optional override for the local mock authentication flow. Mock auth is enabled automatically when the environment is not `production`; set this to `false` if you need to exercise the real Firebase login paths while developing.

### Local Storage

The app stores data locally using AsyncStorage:

- `leetcode_solutions`: Array of solution objects
- `review_sessions`: Array of review session records

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Algorithm Details

The FSR algorithm is based on SuperMemo SM-2 with the following parameters:

- **Initial Ease Factor**: 2.5
- **Minimum Ease Factor**: 1.3
- **Interval Calculation**:
  - First review: 1 day
  - Second review: 6 days
  - Subsequent reviews: previous interval × ease factor

The ease factor is adjusted based on user performance:
- Perfect recall: ease factor increases
- Difficult recall: ease factor decreases
- Failed recall: interval resets

This creates a personalized learning schedule that adapts to your memory retention patterns.
