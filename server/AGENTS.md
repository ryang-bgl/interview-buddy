# Repository Guidelines

## Project Structure & Module Organization
The Spring Boot application lives in `src/main/java/com/litdeck/backend`. Controllers expose REST endpoints, services encapsulate business logic, and configuration/security classes sit under `config` and `security`. jOOQ-generated types are committed under `jooq`; regenerate instead of editing them manually. Supporting resources (e.g., `application.properties`) live in `src/main/resources`, while database migrations are versioned in `db/` with SQL changelogs under `db/changelog/`. Build artifacts in `bin/` are generated—avoid checking new ones in.

## Build, Test, and Development Commands
- `./gradlew bootRun` — start the API against a MySQL instance on `localhost:33008` using local env vars.
- `./gradlew build` — compile sources, run tests, and package the executable JAR.
- `./gradlew test` — execute the JUnit 5 suite; ensure MySQL/Testcontainers can start.
- `./gradlew update` — apply Liquibase migrations defined in `db/db.changelog-master.xml`.
- `./gradlew jooqCodegen` — regenerate jOOQ classes after schema changes (run post-migration).
Set `DB_USER`, `DB_PASSWORD`, and `JWT_SECRET` as needed before running commands.

## Coding Style & Naming Conventions
Target Java 21 features, keep 4-space indentation, and place braces on new lines. Classes use PascalCase, methods and variables camelCase, and constants UPPER_SNAKE_CASE. New code should stay under `com.litdeck.backend` aligned with the controller/service/repository layers. Favor constructor injection, keep DTOs immutable, and leave jOOQ outputs read-only—extend or wrap them for custom behavior.

## Testing Guidelines
Place unit and slice tests in `src/test/java`, naming classes with the `*Tests` suffix. Use `@SpringBootTest` for end-to-end flows, `@WebMvcTest` for controller slices, and Testcontainers for MySQL-dependent scenarios instead of mocks. Cover new endpoints and service branches with assertions and edge cases. Run `./gradlew test` locally before pushing, and add regression tests alongside bug fixes.

## Commit & Pull Request Guidelines
History is sparse; write imperative, scoped commits (e.g., `Add flashcard review endpoint`). Adopt Conventional Commit prefixes (`feat:`, `fix:`, `chore:`) when it clarifies intent. PRs should explain the change, list verification steps (commands run, migrations executed), and call out schema or contract updates. Link tracking issues when available and include screenshots or API examples if the response shape changes.

## Security & Configuration Tips
`src/main/resources/application.properties` loads credentials from environment variables—never commit secrets directly. When adding new settings, provide sane defaults and make them overrideable. Liquibase and jOOQ expect a MySQL instance on port 33008; keep credentials consistent across Gradle, application properties, and test containers. Rotate JWT secrets in non-development environments and document required environment variables in PR descriptions.
