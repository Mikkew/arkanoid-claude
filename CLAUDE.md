# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arkanoid game. Plain HTML, CSS, JavaScript. Zero dependencies, no build step, no framework. Playable directly in browser.

**Status: not implemented yet.** Repo has only assets and spec-workflow tooling — no `index.html`, no game source, no `package.json`. Not a git repo yet either.

## Spec workflow (this repo's development process)

Two custom skills drive how features here get built — follow them, don't improvise around them:

- **`/spec`** (`.agents/skills/spec/SKILL.md`, `.claude/skills/spec/` mirror) — turns a feature idea into `specs/NN-slug.md`. Asks clarifying questions first (Phase 2), writes the spec only once scope/data/plan/acceptance-criteria are unambiguous. Never writes code. New spec state starts as `Draft`.
- **`/spec-impl NN-slug`** (`.agents/skills/spec-impl/SKILL.md`) — implements an *Approved* spec only. Refuses anything not in state `Approved` (or equivalent in another language). Creates branch `spec-NN-slug`, then implements the plan step by step, pausing for diff review after each step. Never commits automatically.

Practical implication: don't write game code directly from a casual request if a spec-driven feature is being discussed — check `specs/` first. If `specs/` doesn't exist yet, no spec has been through the process yet.

Replies in the `/spec` and `/spec-impl` flows must match the language the user opened the conversation in (this repo's own docs mix Spanish and English).

## Assets

- `assets/spritesheet-breakout.png` — sprite atlas (paddle, ball, colored blocks, explosion frames per color).
- `assets/spritesheet.js` — vanilla JS loader/drawer for the atlas:
  - `loadSpritesheet(cb)` — loads the PNG once (cached on an offscreen canvas), queues callbacks until ready.
  - `drawSprite(ctx, name, x, y, w, h)` — draws a named sprite (`'paddle'`, `'ball'`, or `'block_<color>'` where color is one of `gray|red|yellow|cyan|magenta|hotpink|green`) at a destination rect.
  - `drawFrame(ctx, frame, x, y, w, h)` — draws a raw `{sx, sy, sw, sh}` frame, used for explosion animation frames (`EXPLOSION_FRAMES[color][i]`, 4 frames per color, `EXPLOSION_DURATION = 150`ms total).
  - No colored block sprite for `blue`/`orange`/etc. beyond the seven listed above — reuse an existing color if a new block type is needed, don't assume a sprite exists.
- `assets/sounds/ball-bounce.mp3`, `assets/sounds/break-sound.mp3` — the only sound assets present.

When implementing gameplay, load and draw through `spritesheet.js`'s existing functions rather than hand-rolling new sprite-slicing logic.

## No git repo yet

`git` commands will fail until `git init` is run. If a task needs branch/commit workflow (e.g. `/spec-impl`), check this first and offer to `git init` rather than assuming history exists.
