# LeetStack Project Structure

## Repository Overview

LeetStack is a comprehensive learning platform for technical interviews, focusing on Data Structures and Algorithms (DSA) problems. It consists of four interconnected projects that provide a seamless learning experience across multiple platforms.

## Project Architecture

```
leetstack/
├── browser-extension/     # Chrome/Firefox extension for content capture
├── serverless/           # AWS-based backend API
├── mobile-client/        # React Native mobile app
├── web-app/             # Main web application
└── project_structure.md # This file
```

## 1. Browser Extension (`/browser-extension`)

**Purpose**: Chrome/Firefox extension that captures web content and converts it into study materials.

### Technology Stack
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite with CRXJS plugin
- **Styling**: Tailwind CSS
- **Storage**: Supabase integration

### Key Features
- Content script injection for webpage interaction
- Background scripts for persistent operations
- Popup interface for user controls
- AI-powered content conversion to study notes/flashcards
- Real-time sync with backend services

### Directory Structure
```
browser-extension/
├── public/              # Static assets and extension manifest
├── src/
│   ├── background/      # Background service worker
│   ├── content/         # Content scripts for webpage injection
│   ├── popup/           # Extension popup UI components
│   ├── lib/             # Shared utilities and helpers
│   └── assets/          # Extension-specific assets
├── dist/                # Built extension files
└── release/             # Packaged extension for distribution
```

## 2. Serverless Backend (`/serverless`)

**Purpose**: AWS-based backend API that serves all client applications with REST endpoints and real-time features.

### Technology Stack
- **Infrastructure**: AWS CDK (CloudFormation)
- **Runtime**: Node.js with TypeScript
- **Services**: AWS Lambda, API Gateway v2, DynamoDB
- **AI Integration**: OpenAI API
- **WebSockets**: Real-time communication support

### Key Features
- RESTful API with HTTP and WebSocket support
- DSA problem management and tracking
- AI-powered solution generation
- Note processing and flashcard generation
- User authentication and API key management
- Anki deck export functionality

### Directory Structure
```
serverless/
├── bin/                 # CDK entry point
├── lib/                 # CDK stack definitions
├── src/
│   ├── functions/       # Lambda handlers
│   │   ├── auth/        # Authentication endpoints
│   │   ├── dsa/         # DSA problem management
│   │   ├── notes/       # Note processing & flashcard generation
│   │   └── user/        # User management
│   └── shared/          # Shared utilities, types, and configurations
├── tests/               # Unit and integration tests
├── cdk.out/             # Synthesized CloudFormation templates
└── dist/                # Built Lambda functions
```

## 3. Mobile Client (`/mobile-client`)

**Purpose**: React Native mobile application for on-the-go learning and review.

### Technology Stack
- **Framework**: Expo with React Native 0.81
- **Language**: TypeScript
- **Navigation**: Expo Router
- **State Management**: Zustand
- **Authentication**: Firebase Auth
- **Storage**: AsyncStorage for offline support

### Key Features
- Mobile-optimized DSA problem viewer
- Interactive note review system
- Progress tracking and analytics
- Offline access to downloaded content
- Firebase authentication integration

### Directory Structure
```
mobile-client/
├── app/                 # Expo Router navigation structure
├── components/          # Reusable UI components
├── stores/              # Zustand state management stores
├── services/            # API integration and external services
├── utils/               # Helper functions and utilities
├── test/                # Test files
├── android/             # Android-specific configuration
├── ios/                 # iOS-specific configuration
└── design/              # Design assets and specifications
```

## 4. Web Application (`/web-app`)

**Purpose**: Main web application providing the full desktop learning experience.

### Technology Stack
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **State Management**: MobX
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Authentication**: Supabase Auth

### Key Features
- Comprehensive problem dashboard
- Advanced notebook management
- Flashcard review interface
- User settings and profile management
- Full integration with all backend services

### Directory Structure
```
web-app/
├── public/              # Static assets
├── src/
│   ├── features/        # Feature-based modules
│   │   ├── auth/        # Authentication flows
│   │   ├── dashboard/   # Problem tracking dashboard
│   │   ├── notebook/    # Note management
│   │   └── settings/    # User preferences
│   ├── components/      # Shared UI components
│   ├── stores/          # MobX state stores
│   ├── lib/             # Core utilities and configurations
│   └── assets/          # Application assets
├── dist/                # Built application
└── design/              # UI/UX design resources
```

## Technology Stack Summary

### Frontend Technologies
- **React 19**: Latest React version across all platforms
- **TypeScript**: Type safety and improved developer experience
- **Tailwind CSS**: Consistent styling system across web and extension
- **Vite**: Fast build tool for web applications

### Backend Technologies
- **AWS CDK**: Infrastructure as Code
- **AWS Lambda**: Serverless compute
- **DynamoDB**: NoSQL database for primary storage
- **API Gateway v2**: HTTP APIs and WebSocket support
- **OpenAI API**: AI-powered content generation

### Authentication & Data
- **Supabase**: Real-time database and auth (web/extension)
- **Firebase**: Authentication service (mobile)
- **DynamoDB**: Primary data storage (backend)

## Project Interconnections

### Data Flow Architecture
1. **Content Capture**: Browser extension captures web content → Backend processing
2. **AI Processing**: Backend uses OpenAI to generate study materials → Stored in DynamoDB
3. **Cross-Platform Sync**: All clients access data through shared backend APIs
4. **Real-time Updates**: WebSocket connections enable live synchronization

### Shared Services
- **Authentication**: Unified user identity across platforms
- **API Layer**: Consistent REST endpoints for all clients
- **Data Models**: Shared TypeScript types ensure consistency
- **AI Pipeline**: Centralized OpenAI integration for content processing

## Development Workflow

### Build Commands
```bash
# Browser Extension
cd browser-extension && npm run dev    # Development mode
cd browser-extension && npm run build  # Production build

# Serverless Backend
cd serverless && npm install          # Install dependencies
cd serverless && npx cdk deploy       # Deploy infrastructure

# Mobile Client
cd mobile-client && npx expo start    # Start development server
cd mobile-client && npx expo build    # Build for production

# Web Application
cd web-app && npm run dev            # Development server
cd web-app && npm run build          # Production build
```

### Code Conventions
- **Java**: Not used in this project (reference in AGENTS.md appears outdated)
- **TypeScript/React**: 2-space indent, PascalCase components, camelCase utilities
- **Serverless**: TypeScript handlers in `src/functions/`, single exported `handler` function
- **Testing**: Mirror source structure, use Jest/Vitest for unit tests

## Key Features Across the Ecosystem

1. **DSA Problem Tracking**: Comprehensive system for tracking coding interview problem progress
2. **Smart Content Generation**: AI-powered conversion of web content to structured study materials
3. **Spaced Repetition Learning**: Optimized review system for long-term retention
4. **Multi-Platform Accessibility**: Seamless experience across desktop, mobile, and browser
5. **Integration Ecosystem**: Export capabilities for popular tools like Anki

## Architecture Principles

1. **Microservices**: Serverless architecture for scalability and maintainability
2. **Type Safety**: TypeScript throughout for robust code
3. **Offline Support**: Mobile app functions without internet connection
4. **Real-time Sync**: WebSocket integration for live updates
5. **Cross-Platform Consistency**: Shared data models and API contracts

This architecture provides a modern, scalable solution for technical interview preparation with excellent separation of concerns and platform-specific optimizations.