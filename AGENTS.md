# Repository Guidelines

## Project Structure & Module Organization
- `server/`: Spring Boot 3.2 service with logic in `src/main/java`, configs in `src/main/resources`, Liquibase changelogs under `db/`, and tests beneath `src/test/java`.
- `browser-extension/`: Chrome MV3 popup built with React + TypeScript; source lives in `src/`, static assets in `public/`, and Vite outputs to `dist/`.
- `serverless/`: AWS Lambda + API Gateway stack (TypeScript) that mirrors the core REST APIs using DynamoDB tables for users, API keys, and DSA notes.
- `design/`, `specs/`, `sessions/`: documentation spaces for diagrams, product notes, and interview transcripts; keep binaries out of git.

## Build, Test, and Development Commands
- `./gradlew bootRun | build | test | jooqCodegen`: run the Spring app, build artifacts, execute Testcontainers suites, or refresh generated jOOQ models.
- `npm run --prefix browser-extension dev | build | preview`: start the popup with Vite, produce the MV3 bundle, or preview the compiled assets.
- `npm install && npx cdk synth|deploy --app "npx ts-node bin/app.ts"` inside `serverless/`: install CDK deps, synthesize the CloudFormation template, and deploy the Lambda/API/DynamoDB stack.

## Coding Style & Naming Conventions
- Java: 4-space indent, PascalCase types, camelCase members, constructor injection, controllers under `...controller`, DTOs aligning with Liquibase and jOOQ models.
- TypeScript/React: 2-space indent, PascalCase components, camelCase hooks/utilities, colocate logic under `src/features/<area>/index.tsx`.
- Serverless Lambdas: prefer TypeScript handlers in `src/functions/<feature>/`, export a single `handler`, and lean on AWS SDK v3 clients.

## Testing Guidelines
- Mirror Java package paths in `src/test/java`; suffix unit tests with `Test` and container-backed suites with `IT`.
- Testcontainers-backed MySQL is mandatory for persistence tests; never reuse a shared DB. For serverless, write unit tests against handler functions and use `npm run test` (Vitest/Jest) once added.

## Commit & Pull Request Guidelines
- Write imperative commits (`Add auth filter`, `Port DSA API to Lambda`). Squash noisy spikes before pushing.
- PRs should summarize the change, link issues, call out schema or infra impacts (e.g., new DynamoDB table), and attach screenshots or screencasts for UI updates.
- Verify Gradle, Vite, and relevant CDK/SAM builds locally, then list manual verification steps (API calls, Lambda invocations, browser flows) in the PR description.
