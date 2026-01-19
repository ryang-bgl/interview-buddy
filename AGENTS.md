# LeetStack Repository Guidelines

## Project Overview
LeetStack is a full-stack DSA learning platform with web, mobile, and browser extension clients connecting to shared backend services (Supabase + AWS Lambda).

## Project Structure & Module Organization

### Client Applications
- **`web-app/`**: React 19 + Vite web application with MobX state management, Tailwind CSS, Radix UI, and Supabase backend
- **`mobile-client/`**: React Native (Expo) mobile app with Expo Router, Zustand state management, and Supabase database
- **`browser-extension/`**: Chrome MV3 extension built with React + TypeScript, Vite + CRXJS, content script for LeetCode integration
- **`website/`**: Astro-based marketing/documentation site with Tailwind CSS

### Backend & Infrastructure
- **`serverless/`**: AWS CDK + TypeScript stack with Lambda functions, API Gateway, and DynamoDB tables for DSA notes, users, and API keys
- **`shared-types/`**: TypeScript type definitions shared across all applications
- **`project-shared/`**: Shared utilities and components

### Documentation & Assets
- **`design/`**: Design assets and screenshots (chrome/, doc/ subdirectories)
- **`specs/`**: Product specifications and feature documentation
- **`sessions/`**: Interview transcripts and session data
- **`chrome-store/`**: Chrome Web Store listing assets and screenshots
- **`assets/`**: Shared static assets

## Build, Test, and Development Commands

### Web App (`web-app/`)
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run Vitest tests
npm run lint         # Run ESLint
```

### Mobile Client (`mobile-client/`)
```bash
npm start            # Start Expo dev server
npx expo start       # Alternative start command
npm run test         # Run Vitest tests
eas update           # Deploy over-the-air update
eas build            # Build for iOS/Android stores
```

### Browser Extension (`browser-extension/`)
```bash
npm run dev          # Start Vite dev server with hot reload
npm run build        # Build Chrome MV3 extension bundle
npm run preview      # Preview built extension
```

### Serverless (`serverless/`)
```bash
npm install
npx cdk synth        # Synthesize CloudFormation template
npx cdk deploy       # Deploy Lambda/API/DynamoDB stack
./deploy.sh          # CI/CD deployment script
npm run test         # Run Vitest tests
```

### Website (`website/`)
```bash
npm run dev          # Start Astro dev server
npm run build        # Build static site
npm run preview      # Preview production build
```

## Coding Style & Naming Conventions

### TypeScript/React (Web, Extension, Shared)
- 2-space indent
- PascalCase components and types
- camelCase functions, variables, and hooks
- Colocate feature code under `src/features/<area>/`
- Use `.tsx` for components with JSX, `.ts` for utilities

### Mobile Client (React Native)
- Follow React/TypeScript conventions above
- Expo Router file-based routing (app/ directory)
- Zustand stores in `src/stores/`
- Screen components in `src/app/`

### Serverless (AWS CDK)
- TypeScript handlers in `src/functions/<feature>/`
- Export single `handler` from each Lambda
- Use AWS SDK v3 clients
- CDK stacks in `lib/` directory

## Testing Guidelines

### Web App
- Tests colocated: `src/features/*/test.ts`
- Vitest as test runner
- Mock Supabase client in unit tests

### Mobile Client
- Tests in `test/` directory
- Vitest + React Test Renderer
- Mock Supabase dependencies

### Serverless
- Tests in `tests/` directory
- Vitest with AWS service mocking
- Unit tests for handler functions

### Browser Extension
- Tests in `tests/` directory
- Vitest or Jest
- Mock Chrome extension APIs

## Environment Configuration

### Environment Files
- Root `.env` for local development
- `configs/dev.env` - Development environment variables
- `configs/prod.env` - Production environment variables
- Encrypted versions: `.gpg` files for secrets

### Loading Environment
```bash
node configs/loadProjectEnv.mjs
```

### Key Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- API keys for OpenAI, etc.

## Technology Stack

### Frontend
- **React**: 19.1.0 - 19.2.0
- **TypeScript**: 5.8.3 - 5.9.3
- **Vite**: 7.0.4 - 7.2.4
- **Tailwind CSS**: 3.4.15
- **Expo**: Mobile development framework

### State Management
- **MobX**: Web app state
- **Zustand**: Mobile app state

### Backend & Database
- **Supabase**: Shared database, auth, and real-time
- **AWS DynamoDB**: Serverless data storage
- **AWS Lambda**: Serverless compute

### Build Tools
- **Vite**: Web/extension/mobile bundling
- **Expo EAS**: Mobile builds and deployments
- **AWS CDK**: Infrastructure as code
- **Astro**: Static site generation

## Commit & Pull Request Guidelines

### Commits
- Write imperative mood (`Add auth filter`, `Port DSA API to Lambda`, `Fix flashcard display`)
- Squash noisy WIP commits before pushing
- Reference issue numbers when applicable

### Pull Requests
- Summarize the change and motivation
- Link related issues
- Call out schema or infrastructure changes (DynamoDB tables, Supabase migrations)
- Attach screenshots or screencasts for UI changes
- List manual verification steps

### Verification
- Ensure relevant build/test commands pass locally
- Test affected flows (API calls, mobile features, extension behavior)
- Verify no regressions in other clients

## Deployment

### Serverless
- Automated via `deploy.sh` or CI/CD
- Separate dev/prod environments
- Uses AWS CDK for infrastructure deployment

### Mobile
- EAS for iOS App Store and Google Play
- `eas update` for over-the-air updates (Expo Updates)

### Browser Extension
- Build outputs to `dist/`
- Package as ZIP for Chrome Web Store
- Store assets in `chrome-store/`

### Web App
- Vite build to `dist/`
- Deploy to hosting platform (Vercel, Netlify, etc.)

## Shared Dependencies
- All clients use shared Supabase backend
- Common types in `shared-types/`
- Shared utilities in `project-shared/`
