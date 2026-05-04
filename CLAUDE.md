# CLAUDE.md — AI Collaboration Guide

## Project
2D pixel top-down horror investigation game (Phasmophobia-inspired). Browser-first, single-player.

## Priorities
- No complexity ceiling — write whatever's needed to do the job right
- Small scope, no premature features
- Low-token workflow: be concise, don't over-explain

## File Guide
- `README.md` — top-level orientation: how to run, where things live
- `docs/GAME_IDENTITY.md` — what the game is
- `docs/PROJECT_PLAN.md` — milestones and structure
- `docs/TASKS.md` — current work items
- `docs/SESSION_LOG.md` — session notes and decisions
- `index.html` — the entire game (single file, vanilla JS canvas)
- `audio/{music,ambient,sfx,voice}/` — sound assets grouped by purpose
- `sprites/{characters,player,ghost,breaker}/` — pixel art

## Rules
- Plain JS preferred (no heavy frameworks)
- Ask before adding new dependencies
- Update TASKS.md and SESSION_LOG.md each session
