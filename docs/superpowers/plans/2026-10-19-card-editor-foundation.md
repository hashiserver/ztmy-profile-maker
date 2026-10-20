# Card editor foundation Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan inline, task by task.

**Goal:** Deliver the first working original demo template from selection through editing and full-resolution PNG download, without implying MVP completion.

**Architecture:** Astro static pages, one React editor island. Pure layout results feed one Canvas renderer for preview and export. IndexedDB holds per-template versioned drafts locally. No user data leaves the browser.

**Tech Stack:** Astro, React, TypeScript, Tailwind v4, Canvas 2D, IndexedDB, Node tests, Playwright.

**Spec:** `docs/SPEC.md` v1.8; `docs/REVIEW.md` explicitly permits implementation without reopening requirements.

## Global Constraints

- No accounts, backend, uploaded user images, X API, or Cloudflare preview deployment.
- Original operator-created demo assets only. No author-provided artwork until permission is confirmed.
- Pixel coordinates use template source dimensions; template determines text direction.
- Preserve IME, manual newlines, overlong input, and existing incompatible drafts.
- This PR is the first development milestone, not acceptance of all MVP criteria.

## Review Focus

- Draft restoration must precede autosave; version mismatches block overwrite.
- Slow image decoding / drawing must not replace newer edits or export stale content.
- Japanese punctuation, ASCII words and two-digit numbers need explicit vertical layout treatment.
- Text outside its box warns but stays in export; long text is never truncated.
- Upload failure, storage errors and cancelled sharing must leave editing usable.

## Task 1: Validated template and shared layout

Files: `src/lib/model.ts`, `src/lib/layout.ts`, `src/data/templates.ts`, `tests/layout.test.ts`.
Interfaces: `layoutText(text, field, measure) -> LayoutResult`; stable field IDs; glyph placements in source pixels.

- [x] Write tests for preserved newlines, grapheme clusters, horizontal wrap, minimum-size overflow, right-to-left vertical columns, rotated words, two-digit tate-chu-yoko, template geometry validation.
- [x] Run `npm test`; observe expected missing-module failure.
- [x] Implement types, original demo template and layout functions.
- [x] Run `npm test`; all assertions pass.

## Task 2: Working editor and local persistence

Files: `src/lib/render.ts`, `src/lib/drafts.ts`, `src/lib/images.ts`, `src/components/Editor.tsx`, `src/components/CardPreview.tsx`, `src/pages/**`, `src/styles/global.css`, `tests/editor.spec.ts`.
Interfaces: `renderCard(canvas, template, draft, image) -> warnings`; `loadDraft(template) -> state`; revision-aware save and Blob storage.

- [x] Write browser scenarios for template selection, text input/IME, PNG dimensions, reload restoration, incompatible-draft protection, icon upload and mobile layout.
- [x] Run browser scenarios and observe missing pages.
- [x] Build Astro/React shell and one original template. Implement field selection, text style/position controls, circular icon upload/zoom/pan, Canvas PNG download, local draft restore/save, basic share fallbacks.
- [x] Run unit tests, type checking, build, and Playwright scenarios.

## Task 3: Reviewable delivery

Files: `.github/workflows/ci.yml`, `README.md`, `docs/IMPLEMENTATION.md`, `docs/ADR-001-rendering.md`.

- [x] CI runs clean install, typecheck, unit tests, build and browser tests; upload check images.
- [x] Review desktop and 375px screenshots, keyboard focus, no external upload, export pixels, and no horizontal page overflow.
- [x] Record implemented, deferred and device-dependent behavior explicitly; commit and open draft PR.

## Execution decisions

- Continue directly under the existing frozen specification and the user's implementation request; no renewed requirements approval.
- Use this fresh checkout and feature branch as isolation; no second worktree needed.
- First milestone uses two bundled Japanese font families. Full 8–10 fonts and detailed vertical typography remain MVP completion work, not silently removed requirements.

## Verification record — 2026-10-20

- `npm run check`: 0 errors, 0 warnings.
- `npm test`: 9/9 pass.
- `npm run build`: 5 static pages.
- `npm run test:e2e -- --workers=2`: 7/7 pass.
- Independent review: two Important findings fixed (pending upload export, superseded save result). Regression tests pass.
- Pixel regression caught a language inheritance difference between attached and detached Canvas; explicit ja fixes it.
- Minor deferred: composition-time autosave suppression for the share-text field.
