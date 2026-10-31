# Project memory

Last updated: 2026-10-31 (Asia/Seoul)

This file records durable context, not a transcript or automatic assistant memory. Read `AGENTS.md` for working rules, `README.md` for implementation/setup, and `WORKLOG.md` for the latest handoff. Verify changeable facts against source and Git history.

## Product and implementation decisions

- Product: **조금 다른 나**, a Korean photo-to-caricature MVP. The active experience is photo selection → explicit external AI consent → generation → preview and PNG download.
- Only `cute` is active. The prompt version is `cute-marker-caricature-v3`; it requests a simplified black-and-white broad-pen caricature, including two main people when present. Evidence: `app/page.tsx`, `app/api/generate/route.ts`, `lib/prompts.ts`.
- Legacy `similar`/`funny` types, comparison scripts, and reference assets remain experimental material. They are not current product options. `loadStyleReference()` deliberately returns `undefined`. Do not reactivate them as cleanup. Evidence: `lib/generation.ts`, `README.md`, `AB_TEST.md`.
- Current generation uses OpenRouter; the configured default model is an implementation fact, not proof of current provider availability. Consult `lib/generation.ts` and `.env.example`; verify provider support before changing model IDs.
- Preserve consent, validation, metadata removal, request limits, and private/no-store responses. Original photos are processed in memory; optional Private Blob storage is for generated results. See `README.md` and `AGENTS.md` for limits and retention details.
- Real image generation costs money. Routine verification uses mocked tests, not real generation or `npm run compare`.

## Collaboration preferences and handoff decision

- The user works across Linux and other PCs and wants to continue development without depending on a shared live Codex conversation.
- Decision on 2026-10-31: synchronize code and context documents through Git. `AGENTS.md` defines the workflow, this file preserves durable decisions, and `WORKLOG.md` preserves current status and task history.
- Communicate with the user in Korean by default. Documentation may retain existing English technical instructions.
- This workflow is tool-independent: another agent must be instructed to read the repository files if it does not load them automatically. No Hermes migration has been decided or configured.

## Evidence limits

- Earlier conversation history before the migration is unavailable. Do not invent reasons for past implementation choices.
- During this session, VS Code Remote SSH logs reported `already has an active writer` for this conversation while loading history. That confirms a thread writer conflict, but the owning process and a successful fix were not established. Keep this separate from project defects.
- Passing mocked checks does not establish real provider availability, deployed Blob/cron behavior, visual quality, or mobile download compatibility.
- Local credentials and installed dependencies are environment-specific. Never infer that another PC has them because this repository is present.
