# Astro + React Islands Website Migration

## Context

The `website/` package is a vanilla TypeScript demo site for `@klinking/tw-squircle`. It has grown interactive sections (math explorer, code generator) that are increasingly complex to maintain with imperative DOM manipulation. We're migrating to Astro with React islands for the interactive parts, keeping static HTML for everything else.

The monorepo root and `@klinking/tw-squircle` package continue to use vite-plus.

## Architecture

**Framework**: Astro with `@astrojs/react` integration and Tailwind CSS v4.

**Islands**: Two self-contained React components. `MathExplorer` uses `client:load` (above fold). `CodeGenerator` uses `client:visible` (below fold, defers hydration until scrolled into view). Static content (header, footer) stays as Astro/HTML.

**State**: Each island manages its own state with React `useState`. No shared state between islands — MathExplorer and CodeGenerator are fully independent.

## Page Structure (`src/pages/index.astro`)

```
┌─────────────────────────────────────────────┐
│ Header (static HTML)                        │
│   Title, description, GitHub link           │
├─────────────────────────────────────────────┤
│ Math Explorer Section                       │
│   <MathExplorer client:load                 │
│     showRounded={true}                      │
│     showSuperellipse={true}                 │
│     showCorrected={true} />                 │
│   Contains: amount slider, SVG, formula     │
│   readout, comparison table                 │
├─────────────────────────────────────────────┤
│ Code Generator Section                      │
│   <CodeGenerator client:visible />          │
│   Contains: amount slider, radius slider,   │
│   corner mode radios, preview, CSS & TW     │
│   output                                    │
├─────────────────────────────────────────────┤
│ Footer (static HTML)                        │
└─────────────────────────────────────────────┘
```

Each island owns its own amount slider and all its state. No sticky bar needed since the sliders live inside their respective components.

## Components

### `MathExplorer.tsx`

**Props**:

- `showRounded: boolean` — show the circular arc curve
- `showSuperellipse: boolean` — show the uncorrected superellipse curve
- `showCorrected: boolean` — show the corrected superellipse curve
- `amount: number` (optional) — initial amount, defaults to 1.5

**Local state**:

- `amount` — superellipse CSS-K parameter (range -3 to 3). Math functions require conversion: `n = Math.pow(2, K)`.

**Contains**:

- Amount slider (class `slider-unfilled`) + text input for direct editing
- SVG (viewBox 0 0 200 200) with up to three curves
- Formula readout and comparison table (radius, perceived radius, diff)

**Behavior**:

- Auto-scales radius so the largest visible curve fits exactly in the bounding box
- Each curve has dashed stroke offset by 1/3 period, colored via CSS theme variables
- Dots at junction points: filled circle (4px) for rounded, ring (8px) for squircle, ring (12px) for corrected

### `CodeGenerator.tsx`

**Local state**:

- `amount` — superellipse CSS-K parameter (range -3 to 3, default 2)
- `radius` — border radius in px (range 0–160, default 60)
- `cornerMode` — `"round" | "superellipse" | "corrected"` (default `"corrected"`)

**Contains**:

- Amount slider (class `slider-unfilled`) + text input
- Border radius slider (class `slider-filled`) + text input
- Corner mode radio group (Round / Superellipse / Corrected Superellipse)
- Preview div styled via inline styles (not injected `<style>`)
- CSS output textarea (readonly)
- Tailwind classes output textarea (readonly)

**Logic** (migrated from current `updateGenerator`):

- `correctionFactor(cssK)` — computes `(1 - 2^(-0.5)) / (1 - 2^(-1/n))` where `n = Math.pow(2, cssK)`
- `cssCorrectedRadius(value, cssK)` — static values computed fully, dynamic values get `calc(value * factor)`
- `parseCssLength(value)` — extracts numeric part + unit
- `radiusShorthand(corners)` — collapses four corner values to shorthand when all equal
- Generates CSS with `.your-selector {}` and `@supports` block for corrected mode
- Maps px values to closest Tailwind radius tokens (`TW_RADII`, `closestTwRadius`, `twRadiusClass`)

## Existing Code Reuse

- **`math.ts`** — unchanged, imported directly by MathExplorer and CodeGenerator
- **`style.css`** — moves to Astro global styles (imported in layout or page). Theme variables, slider classes all preserved.
- **Tailwind token map** (`TW_RADII`, `closestTwRadius`, `twRadiusClass`) — moves into CodeGenerator or a shared util

## Package Changes

### `website/package.json`

**Remove**: `vite-plus`

**Keep**: `@tailwindcss/vite` (Tailwind v4 uses the Vite plugin, not `@astrojs/tailwind` which is v3 only)

**Add**:

- `astro`
- `@astrojs/react`
- `react`, `react-dom`, `@types/react`, `@types/react-dom`

**Scripts**: `dev` → `astro dev`, `build` → `astro build`, `preview` → `astro preview`

### `website/astro.config.mjs`

```js
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### `website/tsconfig.json`

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

### Monorepo vite override note

The `pnpm-workspace.yaml` overrides `vite` to `@voidzero-dev/vite-plus-core`. Astro bundles its own Vite internally. This override may or may not affect Astro's resolution — test during setup and exclude the website from the override if needed.

## File Structure

```
website/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── src/
│   ├── pages/
│   │   └── index.astro
│   ├── components/
│   │   ├── MathExplorer.tsx
│   │   └── CodeGenerator.tsx
│   ├── math.ts          (unchanged)
│   └── styles/
│       └── global.css    (renamed from style.css)
```

## Migration Notes

- The `index.html` file is replaced by `src/pages/index.astro`
- The monolithic `demo.ts` is split across two self-contained React components
- Preview styling switches from injected `<style>` to React inline styles on the preview div
- SVG rendering switches from imperative `createElementNS` to declarative JSX
- Bidirectional slider/text sync uses React `useState` — each island is fully self-contained

## Verification

1. `pnpm install` succeeds
2. `astro dev` starts, page loads at localhost
3. MathExplorer amount slider updates curves and formula readout
4. CodeGenerator amount slider and radius slider update output and preview independently
5. Corner mode radios switch CSS output format
6. MathExplorer auto-scales correctly
7. CSS output textarea shows valid CSS with `@supports` for corrected mode
8. `astro build` produces static output
