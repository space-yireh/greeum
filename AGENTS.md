<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

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
