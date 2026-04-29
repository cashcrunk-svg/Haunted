# Haunted

A browser-based 2D pixel top-down horror investigation game. Inspired by Phasmophobia — simpler, single-player, runs in any modern browser.

You explore a haunted location, gather evidence with ghost-hunting tools, and identify the type of ghost before it gets you.

## Run it

```bash
npm run dev
```

Then open http://localhost:8000 in a browser. That's it — no build step.

## Project layout

```
.
├── index.html          ← the entire game (single file, vanilla JS canvas)
├── audio/              ← sound assets, grouped by purpose
│   ├── music/          ←   lobby tracks
│   ├── ambient/        ←   crickets, van idle
│   ├── sfx/            ←   doors, footsteps, lights, journal, UI
│   └── voice/          ←   ghost whispers, sanity meds
├── sprites/            ← character + object pixel art
│   ├── characters/
│   ├── player/
│   ├── ghost/
│   └── breaker/
├── scripts/            ← dev tools (linter)
├── tests/              ← Playwright smoke tests
├── docs/               ← project docs (see below)
├── CLAUDE.md           ← AI collaboration guide (kept at root by convention)
└── package.json        ← npm scripts
```

## Docs

All design / planning / log docs live in [docs/](docs/):

- **[docs/GAME_IDENTITY.md](docs/GAME_IDENTITY.md)** — what the game is
- **[docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md)** — milestones and structure
- **[docs/TASKS.md](docs/TASKS.md)** — current work items
- **[docs/SESSION_LOG.md](docs/SESSION_LOG.md)** — session notes and decisions

## Scripts

- `npm run dev` — serve locally on port 8000
- `npm run lint` — custom game linter
- `npm run syntax` — quick JS syntax check on the inline `<script>` block
- `npm run test:smoke` — Playwright smoke test
