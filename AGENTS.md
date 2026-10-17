# Repository Guidelines

## Project Structure & Module Organization

TraceLens is a client workspace with an independently installed frontend and backend:

- `client/` is an npm workspace; the application is `client/TraceLens/`. UI pages and components live in `src/`, API wrappers in `src/services/`, Redux state in `src/store/`, and static files in `public/` and `src/assets/`.
- `server/src/` contains the CommonJS Express backend. Routes, controllers, services, models, middleware, and configuration are separated into their respective directories. Manual checks are in `test-*.js`; evaluation and embedding utilities are in `scripts/`.

## Build, Test, and Development Commands

Run commands from the relevant project directory:

```text
cd client; npm install                            # Install the client workspace
cd client/TraceLens; npm run dev                  # Start the Vite dev server
cd client/TraceLens; npm run build                # Create a production build
cd client/TraceLens; npm run lint                 # Run ESLint
cd server/src; npm install; node server.js        # Start the API after MongoDB connects
cd server/src; npm test                           # Run Node's built-in test suite
cd server/src; npm run test:coverage              # Run tests with coverage output
```

Use targeted checks such as `node test-redaction.js`, `node test-fingerprint.js`, or `node test-ollama.js` when their dependencies are available. The Ollama and evaluation scripts require external services.

## Coding Style & Naming Conventions

Use JavaScript and JSX with clear, small modules. Follow the surrounding file's formatting: frontend files use compact two-space-style JSX indentation, while server files generally use four-space indentation and semicolons. Use PascalCase for React components and models, camelCase for functions and services, and descriptive route filenames such as `project.routes.js`. Run `npm run lint` for frontend changes and keep imports consistent with the existing module system.

## Testing Guidelines

There is no formal test framework or coverage threshold yet. Add focused manual or automated checks alongside the affected behavior, and name standalone checks `test-<area>.js`. For backend changes, verify API behavior with the required MongoDB and Ollama configuration before opening a pull request.

## Security & Configuration

Keep secrets out of Git. The backend expects environment values including `PORT`, MongoDB URIs, access and refresh token secrets, `OLLAMA_MODEL`, `OLLAMA_BASE_URL`, and `FRONTEND_URL`. Use a local `.env` file and document new variables without committing credentials.

## Commit & Pull Request Guidelines

The repository currently has limited Git history, so use short, imperative commit subjects such as `Add incident search endpoint`. Pull requests should explain the behavior changed, identify validation commands, link a relevant issue when one exists, and include screenshots or request examples for visible or API-facing changes.


# MERN Project Engineering Rules

## 1. Understand Before Editing
- Inspect the existing project structure before making changes.
- Read relevant components, routes, controllers, models, middleware, services, and tests.
- Trace the complete frontend-to-backend flow before changing an API.
- Follow existing architecture and naming conventions.
- Do not assume a feature is missing without checking the codebase.

## 2. Protect Existing Functionality
- Never rewrite the entire project to implement a small feature.
- Do not change unrelated files.
- Preserve existing API contracts, response shapes, database fields, and authentication behavior unless explicitly required.
- Check all dependencies and callers before changing shared functions or schemas.
- Avoid duplicate components, routes, utilities, and API clients.
- Do not silently remove existing functionality.

## 3. Authentication and Security
- Preserve JWT access-token and refresh-token flows.
- Do not weaken authentication, authorization, RBAC, or session validation.
- Never expose secrets or copy .env values into source code.
- Never modify production data or execute destructive database operations without explicit approval.

## 4. Implementation Workflow
- First inspect the relevant files and explain the current implementation.
- Propose a small, concrete implementation plan.
- Identify risks and possible regression points.
- Implement only the approved scope.
- Reuse existing components, utilities, middleware, and services where appropriate.
- Avoid unnecessary dependencies and unrelated refactoring.

## 5. Verification
- Inspect the final diff.
- Run relevant existing tests, lint checks, and build commands.
- Add or update tests for meaningful behavior changes where appropriate.
- Check API contracts and error handling.
- Never claim a test or build passed unless it was actually executed successfully.
- Report failed checks and unresolved risks honestly.

## 6. Git and Change Management
- Never discard user changes.
- Never run git reset --hard, git clean, destructive migrations, or force pushes without explicit approval.
- Do not commit or push unless requested.
- Keep changes focused and reviewable.

## 7. Communication
- Explain important implementation decisions in simple English and Roman Urdu.
- State which files changed and why.
- Explain how to test the change manually.
- Ask before changing architecture, dependencies, authentication contracts, or database design.
