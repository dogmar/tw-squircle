# Vite Plus Migration & TypeScript Conversion

## Overview

Migrate tw-squircle to use Vite Plus for both npm package building and demo site development/deployment, and convert all JavaScript source files to strict TypeScript.

## Goals

- Replace the hand-rolled Node dev server with Vite's dev server (HMR, Tailwind compilation)
- Build the npm package via Vite Plus `pack` (tsdown-based) with TypeScript declaration files
- Build the demo site via Vite and deploy via GitHub Pages Actions (no committed build artifacts)
- Convert all JS to TypeScript with the strictest compiler settings
- Keep the README auto-sync workflow functional with updated paths

## Project Structure

```
tw-squircle/
├── src/                        # TypeScript source for npm package
│   ├── plugin.ts               # Tailwind plugin (from ./plugin.js)
│   ├── merge.ts                # tailwind-merge config (from ./merge.js)
│   └── squircle.css            # CSS utilities (from ./squircle.css)
├── docs/                       # Demo site source (never contains build output)
│   ├── src/
│   │   ├── demo.ts             # Demo logic (from ./docs/demo.mjs)
│   │   └── math.ts             # Math utilities (from ./docs/math.mjs)
│   ├── index.html              # Entry point — link and script tags updated
│   ├── styles.css              # Tailwind entry — import path updated
│   └── CNAME                   # GitHub Pages domain (create if needed)
├── dist/                       # Library build output (gitignored)
│   ├── plugin.js
│   ├── plugin.d.ts
│   ├── merge.js
│   ├── merge.d.ts
│   └── squircle.css
├── vite.config.ts              # Updated config with pack + site build
├── tsconfig.json               # Strict TypeScript config (library only)
├── tsconfig.docs.json          # Extends root tsconfig for demo files
└── package.json                # Updated exports, scripts, deps
```

## Build Configuration

### vite.config.ts — Pack + Site Build

Vite Plus uses `pack` (tsdown-based bundler) for npm package builds, not Vite library mode. The existing `staged`, `fmt`, and `lint` config sections are preserved.

**`pack`** (npm package build via `vp pack`):
- Entry points: `src/plugin.ts`, `src/merge.ts`
- Output to `dist/` with ESM format
- `dts: true` for `.d.ts` declaration generation (built into tsdown, no plugin needed)
- Copy `src/squircle.css` to `dist/squircle.css` via `onSuccess` hook or build script

**`vite build --root docs`** (demo site build):
- Root: `docs/`
- `@tailwindcss/vite` plugin added to the `plugins` array in `vite.config.ts`
- Output to a temporary build directory (consumed by CI deploy action)

**`vite --root docs`** (dev server):
- Serves the demo site from `docs/` with HMR
- Vite + `@tailwindcss/vite` handles Tailwind compilation on the fly

**Preserved existing config**:
- `staged: { "*": "vp check --fix" }` (pre-commit hooks)
- `fmt` config with `sortTailwindcss` (stylesheet path stays `./docs/styles.css`)
- `lint` config with `typeAware: true`, `typeCheck: true`

### tsconfig.json — Library (Strictest Settings)

For `src/` only. Does not include `docs/src/` to avoid `rootDir` conflicts.

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

### tsconfig.docs.json — Demo Site

Extends root config for the demo files. Fields inherited from root that don't apply (`outDir`, `declaration`, `declarationMap`) are explicitly disabled since `extends` does not support unsetting fields. `rootDir` is set to `"."` to encompass the full project. This tsconfig is only used for editor type-checking — Vite handles the actual build.

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",
    "declaration": false,
    "declarationMap": false,
    "sourceMap": false
  },
  "include": ["docs/src/**/*"]
}
```

### package.json Updates

**Exports** with `types` conditions for TypeScript consumers:
```json
"exports": {
  "./squircle.css": "./dist/squircle.css",
  "./merge": {
    "types": "./dist/merge.d.ts",
    "import": "./dist/merge.js"
  },
  "./plugin": {
    "types": "./dist/plugin.d.ts",
    "import": "./dist/plugin.js"
  }
},
"files": ["dist"]
```

**Scripts** (using `vp` commands to preserve vite-plus config integration):
```json
"scripts": {
  "dev": "vite --root docs",
  "build": "vp pack && cp src/squircle.css dist/squircle.css",
  "build:site": "vite build --root docs",
  "prepare": "vp config",
  "lint": "vp lint",
  "lint:fix": "vp lint --fix",
  "fmt": "vp fmt",
  "fmt:check": "vp fmt --check",
  "sync-readme": "scripts/sync-readme.sh",
  "prepublishOnly": "npm run build"
}
```

**New dev dependencies**: `@tailwindcss/vite`

**Removed dev dependencies**: `@tailwindcss/cli`

**Removed files**: `scripts/serve.mjs`, `docs/dist.css`, `.oxlintrc.json`, `.oxfmtrc.json` (config now lives in `vite.config.ts`)

## GitHub Workflows

### `.github/workflows/deploy-site.yml` — Deploy Demo Site

- **Trigger**: push to `main`
- **Steps**: install deps (pnpm), `pnpm run build:site`, `actions/upload-pages-artifact`, `actions/deploy-pages`
- **Environment**: `github-pages` with `pages: write`, `id-token: write` permissions

### `.github/workflows/sync-readme.yml` — Updated

- **Trigger**: push to `main` (when files in `src/` change)
- **Steps**: checkout, install deps (pnpm), run `scripts/sync-readme.sh` (reads from `src/` paths), commit and push if changes
- **Commit message**: `docs: sync README code blocks`
- Syncs TypeScript source into README code blocks (shows the actual source, not compiled output)

## Migration Steps

1. Move source files to new locations:
   - `plugin.js` → `src/plugin.ts`
   - `merge.js` → `src/merge.ts`
   - `squircle.css` → `src/squircle.css`
   - `docs/demo.mjs` → `docs/src/demo.ts`
   - `docs/math.mjs` → `docs/src/math.ts`
2. Convert JS files to TypeScript with strict types
3. Add `tsconfig.json` (library) and `tsconfig.docs.json` (demo)
4. Update `vite.config.ts` — add `pack` config and `@tailwindcss/vite` plugin, preserve existing `staged`/`fmt`/`lint` sections
5. Update `package.json` — exports with `types` conditions pointing to `dist/`, new scripts, swap `@tailwindcss/cli` for `@tailwindcss/vite`
6. Update `docs/index.html`:
   - Change `<link href="dist.css">` to `<link href="styles.css">`
   - Change `<script src="demo.mjs">` to `<script src="src/demo.ts">`
7. Update `docs/styles.css` — change Tailwind v4 `@plugin "../plugin.js"` directive to `@plugin "../src/plugin.ts"`
8. Update `scripts/sync-readme.sh` — read from `src/` paths, update README markers (e.g. `<!-- BEGIN:plugin.js -->` → `<!-- BEGIN:plugin.ts -->`), update language tags from `js` to `ts`
9. Add `.github/workflows/deploy-site.yml`
10. Update `.github/workflows/sync-readme.yml`
11. Delete `scripts/serve.mjs`, `docs/dist.css`, `.oxlintrc.json`, `.oxfmtrc.json`
12. Add `dist/` to `.gitignore`
13. Create `docs/CNAME` if it doesn't already exist
