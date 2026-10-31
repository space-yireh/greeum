<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cross-environment handoff (Linux, macOS, Windows)

These repository files are the shared context across computers and new chats. They do not restore chat history or automatically sync files; Git transfers committed files. Use repository-relative paths and portable commands.

### At the start of each task

1. Read this file, `README.md`, `MEMORY.md`, and the current handoff plus recent entries in `WORKLOG.md` before implementation. If the tool does not automatically load `AGENTS.md`, explicitly open it.
2. Check `git status --short`, the current branch, and recent Git history. Preserve existing user changes. If documentation and source disagree, inspect the source and record the discrepancy rather than assuming either is current.
3. Resume unfinished work only within the user's current request. Treat historical notes and proposed next steps as context, not authorization for paid calls, deployment, or unrelated changes.

### Before finishing a task or switching computers

1. Update `WORKLOG.md`: keep its current handoff accurate and append a dated entry with the request, actual changes, checks and outcomes, unresolved issues, and concrete next steps. State when checks were not run. Use Asia/Seoul dates; do not invent past results.
2. Update `MEMORY.md` only when durable decisions, preferences, or constraints change. Record the reason and evidence; mark uncertainty. Keep transient details in the worklog and avoid duplicating the full README.
3. Keep old worklog entries as history. Explicitly supersede outdated memory instead of leaving contradictory instructions. Do not store credentials, environment-variable values, photos, base64, signed links, or raw private logs in either file.
4. Report changed files and validation to the user. Do not commit, push, pull, or switch branches automatically solely because of this handoff procedure. When the user requests Git synchronization, include the context files with the related code and resolve conflicts without discarding either side's work.

### Human workflow when changing computers

- On the departing computer, review and commit the related code plus these context files, then push the branch.
- On the arriving computer, check for local changes, fetch and update the intended branch safely, and start a new chat with: “Read AGENTS.md, MEMORY.md, and WORKLOG.md, inspect Git status, and continue the requested work.”
- Install dependencies and configure local environment variables separately using `README.md`; `.env.local` is intentionally not transferred through Git. Never overwrite an existing environment file.
- Prefer separate branches for concurrent work. An uncommitted file or an unrecorded conversation is not available on another computer through Git.

## Project context after migration (2026-10-31)

- Product: “조금 다른 나”, a Korean photo-to-caricature MVP. Read `README.md` for current behavior and setup; `AB_TEST.md` describes a legacy experiment tool, not current product options.
- Stack: Next.js 16.4.3 App Router, React 19, TypeScript, Node.js, npm (`package-lock.json`). Migration checks used Node.js 24.15.0 and npm 11.12.1.
- UI: `app/page.tsx` and `app/globals.css`. Generation: `app/api/generate/route.ts`; request options and image processing: `lib/generation.ts`; prompt: `lib/prompts.ts`.
- The web app supports only `cute`, with prompt version `cute-marker-caricature-v3`. Legacy `similar`/`funny` types and reference assets are not active product features. `loadStyleReference()` intentionally returns `undefined`.
- Generation calls OpenRouter and costs money. Do not run real generation or `npm run compare` as routine verification. Use mocked tests. Do not change model IDs based on assumptions; verify provider support when that becomes part of a task.
- Source photos are processed in memory and sent to the external AI only after consent. Preserve consent, input validation, metadata removal, request limits, and private/no-store responses. Never log photos, base64, credentials, or provider response bodies.
- Optional generated-result storage uses Vercel Private Blob, enabled only with both `BLOB_READ_WRITE_TOKEN` and a `CRON_SECRET` of at least 32 characters. Signed download links last one hour; daily cleanup deletes results older than 24 hours. See `lib/result-storage.ts` and download/cron API routes.
- At migration, `.env.local` was absent. `.env.example` documents setup; never commit secrets. UI can open without an API key; actual generation requires `OPENROUTER_API_KEY`. Production also requires an exact `APP_ORIGIN`.
- Standard checks: `npm test`, `npm run typecheck`, `npm run build`. Mocked tests do not establish real provider availability, deployed Blob/cron behavior, or mobile download compatibility.
- Migration validation: all 8 test files, typecheck, and production build passed. The restricted execution environment returned empty output from Next.js's TypeScript subprocess (`Could not parse output from TypeScript's --showConfig.`); the same build passed outside that restriction. Do not disable type checking to work around this environment issue. `next-env.d.ts` is generated and may switch between `.next/dev/types` and `.next/types` during dev/build.
- The prior chat history is unavailable. Use source, documentation, and Git history as evidence; distinguish confirmed behavior from unknown past decisions.
