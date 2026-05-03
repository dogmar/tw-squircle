# StyleX support — research notes

Status: **paused**, picked back up on this branch (`feat/stylex-support`). The Panda preset shipped on the parent branch; StyleX needs more design thought before merging.

## Why this is paused

StyleX's babel/swc plugin requires `stylex.create(...)` to receive a fully-static object literal. **Every "factory" or "helper that returns a style object" pattern is rejected at compile time.** Verified directly against `@stylexjs/babel-plugin@0.18.3` — see [`squircle.stylex.compile.test.ts`](../src/squircle.stylex.compile.test.ts) for the live boundary tests. Specifically:

| Pattern                                                                        | Result    | Plugin error                                |
| ------------------------------------------------------------------------------ | --------- | ------------------------------------------- |
| `stylex.create({ a: { borderRadius: { default: '1rem', '@supports …': '…' } } })` | ✅ works | —                                           |
| `stylex.create(buildVariants())` (factory in arg position)                     | ❌ rejects | `create() can only accept an object`        |
| `stylex.create({ a: { ...squircle('1rem') } })` (spread imported call)         | ❌ rejects | internal `func.fn is not a function`        |
| `stylex.create({ a: { borderRadius: { [SUPPORTS]: '…' } } })` (imported string as computed `@`-rule key) | ❌ rejects | `Invalid pseudo or at-rule`            |
| `stylex.create({ a: { padding: corrected('1rem') } })` (function call in value) | ❌ rejects | same as above                               |

The `defineSquircleVariants(stylex.defineVars(...))` API the original plan called for is therefore impossible to ship as a working StyleX-native API today. This was discovered after the JS module was already written and unit-tested in isolation — the unit tests passed because they only verified the plain-JS return shape, not the babel plugin's acceptance of those calls inside `stylex.create`.

## What ships on this branch

The work-in-progress for the StyleX entry. All files exist; the unit tests pass; the **boundary tests pass** (proving the patterns DO fail as expected); but no consumer-visible API on this branch is wired up to actually solve a real StyleX user's problem yet.

- [`package/src/squircle.stylex.ts`](../src/squircle.stylex.ts) — JS helpers (`squircle()`, `squircleTopLeft()`, …, `defineSquircleVariants()`) + constants (`SQUIRCLE_AMOUNT_VAR`, `SQUIRCLE_SUPPORTS_QUERY`) + `correctedRadiusCalc()`. Helpers return plain object literals in StyleX's per-property conditional-value shape. Module docstring **already documents** that they cannot be used inside `stylex.create()`. Useful for: (a) build-time codegen, (b) emotion / styled-components / vanilla-extract / inline styles where function calls in style values are allowed.
- [`package/src/squircle.stylex.test.ts`](../src/squircle.stylex.test.ts) — 11 unit tests on helper return shape (kept passing).
- [`package/src/squircle.stylex.compile.test.ts`](../src/squircle.stylex.compile.test.ts) — real `@stylexjs/babel-plugin` integration tests. Pin both the working "hand-written literal" pattern and the rejected boundary patterns. Resume here when StyleX ships changes.
- [`package/src/squircle-css-sidecar.test.ts`](../src/squircle-css-sidecar.test.ts) — validates the vanilla CSS sidecar.
- [`package/scripts/generate-squircle-css.ts`](../scripts/generate-squircle-css.ts) — added `generateVanillaCss()` that emits `dist/squircle.css` with plain `.squircle-md` etc. classes (no `@utility` directive). Default Tailwind-ish radii (xs/sm/md/lg/xl/2xl/3xl/4xl/full) baked in.
- `package.json` — added `./squircle.css` export, `@stylexjs/{stylex,babel-plugin}` peer (optional), `@babel/{core,preset-typescript}` devDep.
- `pnpm-workspace.yaml` — catalog entries for the above.
- `vite.config.ts` — `stylex` pack entry, `test:stylex-compile` and `test:sidecar` tasks.

## Recommended path forward

Three options, in rough order of how StyleX-native they feel:

### Option 1 — Static CSS sidecar (simplest, probably ship this)

Already built on this branch. Consumers do:

```ts
import '@klinking/squircle/squircle.css';
// <div className="squircle-md" /> alongside any stylex.props(...) styles
```

The class names are inert — they don't go through StyleX's compiler at all, so the static-analysis problem is avoided entirely. The only down-side is class-name collision risk if a consumer also defines `.squircle-md` somewhere; the radii set is fixed to a Tailwind-ish default; and it doesn't compose with `stylex.defineVars` / `stylex.createTheme` for theming.

### Option 2 — Codegen CLI (most StyleX-native)

Ship a one-shot script (e.g. `npx @klinking/squircle/codegen --radii=sm:0.25rem,md:0.375rem --side=all --out=src/squircle.stylex.ts`) that emits a literal `*.stylex.ts` file the consumer checks in. The emitted file is a hand-written `stylex.create({...})` literal so StyleX's compiler is happy.

This is the only path that lets a StyleX consumer use *their own* `defineVars` radii and still get the full StyleX-native experience (`stylex.props(squircleStyles.md)`). The cost is meaningful: we'd ship a CLI, document a "regenerate after changing your radii" workflow, and the generated file would be a new artifact in the consumer's repo.

The existing `defineSquircleVariants()` helper is *exactly* what such a CLI would call internally — that's its real reason for existing. Resume here by:

1. Add a `bin` entry in `package.json`.
2. Wrap `defineSquircleVariants` in a small CLI that JSON-stringifies the output and writes it as a `stylex.create(...)` literal source file.
3. Test the generated file by running it through `@stylexjs/babel-plugin` (the test scaffold already exists in `squircle.stylex.compile.test.ts`).

### Option 3 — Babel macro

A `babel-plugin-macros`-style import that inlines the `stylex.create({...})` literal at consumer compile time. Works around the static-analysis problem by transforming the source before StyleX sees it. Cost: depends on `babel-plugin-macros` (not universally installed), adds a runtime dependency, more complex to debug. Probably not worth it given Option 2 covers the same use case more transparently.

### Option that does **not** work — pre-baked `stylex.create`

Could ship `stylex.create({...})` calls in the package's own source, processed by `@stylexjs/babel-plugin` at our build time. Two blockers: (a) we don't know the consumer's radii, and (b) atomic class names hash with version coupling, so consumers' bundlers re-process the package source anyway. The user's earlier instruction — "no default export with tailwind radii" — also rules this out by preference.

## How to resume

```bash
git checkout feat/stylex-support
cd package
pnpm install
vp run @klinking/squircle#test:stylex-compile  # runs the boundary tests
```

The boundary tests are the canary: re-run them against newer `@stylexjs/babel-plugin` versions to see if any of the rejected patterns become accepted. If they do, the factory API may become viable.

When picking a direction:

- For Option 1 (sidecar): just merge this branch as-is, write the README path, done.
- For Option 2 (codegen): keep everything on this branch, add a `bin/squircle-stylex-codegen.ts`, add CLI args parsing, generate a sample output file, snapshot-test it, run it through the babel plugin to verify, document.
- For Option 3 (macro): start a fresh branch — different dependency surface, different mental model.

## Key files

- `package/src/squircle.stylex.ts:46` — module docstring with the "do not call inside `stylex.create`" warning.
- `package/src/squircle.stylex.compile.test.ts:60` — verified working pattern (hand-written literal).
- `package/src/squircle.stylex.compile.test.ts:91` — boundary tests pinning the failure modes.
- `package/scripts/generate-squircle-css.ts:46` — vanilla-CSS sidecar generator.

## Test plan when resuming

1. `vp run @klinking/squircle#build` — must produce `dist/squircle.css` and `dist/stylex.mjs`.
2. `vp run @klinking/squircle#test:sidecar` — sidecar shape.
3. `vp run @klinking/squircle#test:stylex` — JS helper unit tests.
4. `vp run @klinking/squircle#test:stylex-compile` — real babel-plugin integration.
5. Manual smoke in `website/` — add a tiny example component, check DevTools that `@supports (corner-shape: superellipse(2))` activates in supporting browsers and falls back cleanly elsewhere.
