# Repository Guidelines

## Project Structure & Module Organization
- `server/`: Spring Boot 3.2 API. Business logic lives in `src/main/java`, configuration in `src/main/resources`, tests in `src/test/java`, and Liquibase changelogs in `db/`.
- `browser-extension/`: Chrome MV3 popup built with React + TypeScript. Source under `src/`, assets in `public/`, and Vite bundles to `dist/`.
- `design/`, `specs/`, `sessions/`: living documentation; add diagrams or transcripts here and keep large binaries out of git.
- `browser-extension-bak/`: legacy build kept for reference only—touch it only when porting patterns into the active extension.

## Build, Test, and Development Commands
- `./gradlew bootRun`: launch the API with hot reload and default MySQL settings.
- `./gradlew build`: compile, run tests, and emit `server/build/libs/*.jar`.
- `./gradlew test`: execute JUnit 5 suites backed by Testcontainers; requires Docker.
- `./gradlew jooqCodegen`: refresh generated jOOQ models after Liquibase migrations.
- `npm run --prefix browser-extension dev|build|preview`: start Vite, bundle the MV3 release, or preview the build output.

## Coding Style & Naming Conventions
- Java: 4-space indent, PascalCase types, camelCase members. Prefer constructor injection, keep REST controllers in `...controller`, and align DTOs with jOOQ POJOs and Liquibase naming.
- TypeScript: 2-space indent, camelCase variables, PascalCase React components. Organize popup logic under `src/features/<area>/` and export a single entry module per folder.
- Run your IDE formatter or `./gradlew build`/Vite builds before committing; they surface obvious style issues.

## Testing Guidelines
- Mirror package structure in `src/test/java`; name tests `<ClassName>Test` or `<Feature>IT` for container-backed integration cases.
- Use Testcontainers-managed MySQL for persistence coverage—never point tests at shared instances.
- The extension currently lacks automated tests; document manual scenarios in PRs until a Vitest harness is added.

## Commit & Pull Request Guidelines
- Write concise, imperative commits (`Add auth filter`, `Fix popup focus`). Squash noisy work-in-progress changes locally.
- PRs must summarize the change, link issues, note schema or config impacts, and attach screenshots/GIFs for UI updates.
- Confirm Gradle and Vite builds pass and list manual verification steps before requesting review.

## Database & Configuration Notes
- Local tooling assumes MySQL on `localhost:33008` with credentials declared in `build.gradle`/Liquibase; override via environment variables for shared environments.
- Apply Liquibase migrations first, then run `./gradlew jooqCodegen` to keep generated sources in sync.

## Server project guideline
### Controller
- use @ResponseBody to return responses
- name request body and response body as Dto
