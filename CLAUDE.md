# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arkanoid game. Plain HTML, CSS, JavaScript. Zero dependencies, no build step, no framework. Playable directly in browser (open `index.html`).

**Status: playable.** Specs 01–04 are implemented (see `specs/`). Git repo exists, default branch `main`, feature work lives on `spec-NN-slug` branches.

## Files

- `index.html` — one `<canvas id="game" width="480" height="640">`. Loads `assets/spritesheet.js`, then `game.js`.
- `style.css` — centers canvas, keeps aspect ratio on resize.
- `game.js` — all game code (state, input, physics, render, loop, sound). Single file, no modules.
- `assets/` — sprites and sounds (see Assets).
- `specs/` — one markdown spec per feature (see Spec workflow).
- `.agents/skills/` — source of the `spec` and `spec-impl` skills. `.claude/skills/spec` and `.claude/skills/spec-impl` are symlinks to them. `skills-lock.json` pins their upstream hash.

## Game architecture (`game.js`)

- Logical resolution fixed at 480x640 (`WIDTH`/`HEIGHT`). CSS scales the canvas; never use CSS pixels for game logic.
- Single `state` object: `status`, `level`, `score`, `lives`, `paddle`, `ball`, `blocks`, `explosions`.
- `state.status` is the screen state machine: `start | playing | paused | gameover | victory | levelcomplete`. `render()` picks the overlay from it.
- Levels: `LEVELS` array of `{ grid, ballSpeed }`. `grid` rows are 8-char strings decoded by `CELL_BLOCKS` (`.` empty, `R Y G C M` 1-hit colors, `X` = `gray` with 2 hits). `PADDLE_W` is fixed.
- Score and lives persist across levels. `loadLevel(n)` does not touch them; `resetState()` does.
- Main loop `frame(time)` uses delta time in seconds. Animations (`state.explosions`) advance with dt, so they freeze on pause.
- Sound rule: `bounce` on paddle and wall hits, `break` on every block hit. Never both for one block hit.

## Code conventions

- Use arrow functions (`const fn = () => {};`), not `function` declarations.
- Comments and UI text in Spanish, code identifiers in English.
- Match existing style in `game.js`: `const` helpers at top level, no classes, no globals beyond what is already declared.
- Do not add dependencies, bundlers, or a `package.json`.

## Spec workflow (this repo's development process)

Features are built spec-first. Two custom skills drive it — follow them, don't improvise around them:

- **`/spec <idea>`** (`.agents/skills/spec/SKILL.md`, template in `.agents/skills/spec/template.md`) — turns a feature idea into `specs/NN-slug.md`. Four phases: (1) read context + last two specs, (2) ask clarifying questions in blocks of 3–5, (3) write spec, (4) save as `Draft` and stop. Never writes code. Never proposes implementing after saving.
- **`/spec-impl NN-slug`** (`.agents/skills/spec-impl/SKILL.md`) — implements an *Approved* spec only. Four phases: (1) locate spec by number/slug/full name, (2) validate state is `Approved`, (3) create/switch to branch `spec-NN-slug` and show objective, scope, plan, criteria, (4) implement the plan one step at a time, pausing for diff review after each.

Both skills have `disable-model-invocation: true`: only the user triggers them.

### Spec file format

- Path: `specs/NN-slug.md`, `NN` zero-padded sequential, slug kebab-case. Currently 01–04.
- Language: Spanish body, with section headings in English (`Scope`, `Data model`, `Implementation plan`, `Acceptance criteria`, `Decisions`, `Risks`, `What is **not** in this spec`). New specs must match the existing ones.
- Header blockquote: `**Status:**`, `**Depends on:**`, `**Date:**`, `**Objective:**` (one sentence).
- Status values used in this repo (English): `Draft` → `In review` → `Approved` → `Implemented` (or `Obsolete`).
- Scope has two mandatory blocks: **In** and **Out of scope (for future specs)**.
- Acceptance criteria are a boolean `- [ ]` checklist, each item verifiable yes/no.
- Plan steps must each leave the game runnable.

### Rules of the flow

- **Humans change status.** Agent writes specs as `Draft`. Only the user moves it to `Approved`. After implementation and verifying acceptance criteria, status goes to `Implemented`.
- **Never commit automatically.** `/spec-impl` shows diffs; user decides when to commit.
- **Implement what the spec says.** Suboptimal spec detail → mention as observation, don't change code silently. Spec ambiguity → stop, give 2–3 options, wait. Out-of-scope request → note it for next spec, don't implement on this branch.
- Don't write game code from a casual request when a spec-driven feature is under discussion. Check `specs/` first.
- `specs/.spec-config.yml`: `AutoCreateBranch: true` (default) makes `/spec-impl` create `spec-NN-slug` without asking; `false` asks `[y/N]`. Don't overwrite it.
- `/spec-impl` requires a clean working tree before switching branches. Don't stash or commit on the user's behalf.
- Branch exists already → resume: read `git log --oneline`, say which steps look done, wait for confirmation of resume point.

### Commit conventions

Conventional Commits, as in history: `feat:`, `docs:`, `chore:`. Spec files go in `docs:` commits (`docs: add SPEC 03 ...`, `docs: mark SPEC 02 as implemented`), implementation in `feat:`.

Replies in the `/spec` and `/spec-impl` flows must match the language the user opened the conversation in.

## Assets

- `assets/spritesheet-breakout.png` — sprite atlas (paddle, ball, colored blocks, explosion frames per color).
- `assets/spritesheet.js` — vanilla JS loader/drawer for the atlas:
  - `loadSpritesheet(cb)` — loads the PNG once (cached on an offscreen canvas), queues callbacks until ready.
  - `drawSprite(ctx, name, x, y, w, h)` — draws a named sprite (`'paddle'`, `'ball'`, or `'block_<color>'` where color is one of `gray|red|yellow|cyan|magenta|hotpink|green`) at a destination rect.
  - `drawFrame(ctx, frame, x, y, w, h)` — draws a raw `{sx, sy, sw, sh}` frame, used for explosion animation frames (`EXPLOSION_FRAMES[color][i]`, 4 frames per color, `EXPLOSION_DURATION = 150`ms total).
  - No colored block sprite for `blue`/`orange`/etc. beyond the seven listed above — reuse an existing color if a new block type is needed, don't assume a sprite exists.
- `assets/sounds/ball-bounce.mp3`, `assets/sounds/break-sound.mp3` — the only sound assets present.

When implementing gameplay, load and draw through `spritesheet.js`'s existing functions rather than hand-rolling new sprite-slicing logic.

## Testing

No test framework. Verify by opening `index.html` in a browser, checking the console for errors, and walking the spec's acceptance criteria one by one.
