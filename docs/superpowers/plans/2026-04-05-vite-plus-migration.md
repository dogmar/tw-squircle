# Vite Plus Migration & TypeScript Conversion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate tw-squircle to Vite Plus for package building (via `vp pack`) and demo site dev/build, and convert all JS to strict TypeScript.

**Architecture:** Single `vite.config.ts` with `pack` config for the npm library (tsdown-based, outputs `dist/`) and Vite dev/build for the demo site (`docs/` root). Two tsconfigs: root for library, `tsconfig.docs.json` for demo. GitHub Actions for site deploy and README sync.

**Tech Stack:** Vite Plus (vp pack / tsdown), TypeScript (strictest), @tailwindcss/vite, pnpm

**Spec:** `docs/superpowers/specs/2026-04-05-vite-plus-migration-design.md`

---

### Task 1: Project scaffolding — tsconfigs, .gitignore, directory structure

**Files:**
- Create: `tsconfig.json`
- Create: `tsconfig.docs.json`
- Create: `src/` (directory)
- Create: `docs/src/` (directory)
- Modify: `.gitignore`

- [ ] **Step 1: Create `src/` and `docs/src/` directories**

```bash
mkdir -p src docs/src
```

- [ ] **Step 2: Add `dist/` to `.gitignore`**

`.gitignore` should become:
```
node_modules/
dist/
```

- [ ] **Step 3: Create `tsconfig.json`**

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

- [ ] **Step 4: Create `tsconfig.docs.json`**

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

- [ ] **Step 5: Commit**

```bash
git add tsconfig.json tsconfig.docs.json .gitignore
git commit -m "chore: add tsconfigs and update gitignore for migration"
```

---

### Task 2: Move and convert `docs/math.mjs` → `docs/src/math.ts`

This is the pure math library with no DOM dependencies — easiest to convert first. Other files depend on it.

**Files:**
- Create: `docs/src/math.ts`
- Delete: `docs/math.mjs`

- [ ] **Step 1: Create `docs/src/math.ts`**

Convert the file to TypeScript. The main changes are adding type annotations to all function signatures and the internal `bevelDepth` helper. The logic stays identical.

```typescript
interface Point {
  x: number;
  y: number;
}

/**
 * Generate points along a superellipse |x|^n + |y|^n = r^n
 * in the first quadrant. Returns [{x, y}, ...] from (r, 0) to (0, r).
 *
 * Parametric form: x = r * |cos(t)|^(2/n), y = r * |sin(t)|^(2/n)
 * for t from 0 to pi/2.
 *
 * @param n - mathematical exponent (n=2 is circle). CSS `superellipse(K)`
 *   maps to math exponent n = 2^K, so pass `Math.pow(2, K)` here.
 */
export function superellipsePoints(r: number, n: number, numPoints = 100): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * (Math.PI / 2);
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    points.push({
      x: r * Math.pow(Math.abs(cosT), 2 / n) * Math.sign(cosT),
      y: r * Math.pow(Math.abs(sinT), 2 / n) * Math.sign(sinT),
    });
  }
  return points;
}

/**
 * Generate points along a circular arc (quarter circle) of radius r.
 * Returns [{x, y}, ...] from (r, 0) to (0, r).
 */
export function circleArcPoints(r: number, numPoints = 100): Point[] {
  return superellipsePoints(r, 2, numPoints);
}

/**
 * Correction formula: r * (1 - 2^(-1/2)) / (1 - 2^(-1/n))
 * Analytically derived so perceived radius exactly matches a circle.
 */
export function correctedRadius(r: number, n: number): number {
  return r * (1 - Math.pow(2, -0.5)) / (1 - Math.pow(2, -1 / n));
}

/**
 * Bevel depth for a circle of radius r.
 */
export function bevelDepthCircle(r: number): number {
  return bevelDepth(r, 2);
}

/**
 * Bevel depth for a superellipse with exponent n and radius r.
 * depth = r * 2^(1 - 1/n) / sqrt(2)
 */
export function bevelDepthSuperellipse(r: number, n: number): number {
  return bevelDepth(r, n);
}

function bevelDepth(r: number, n: number): number {
  const k = r * Math.pow(2, 1 - 1 / n);
  return k / Math.SQRT2;
}

/**
 * Perceived radius: distance from a reference center to where a curve
 * crosses the diagonal line from that center to the box corner.
 */
export function perceivedRadius(centerR: number, arcR: number, n: number): number {
  const apexFromCorner = arcR * (1 - Math.pow(2, -1 / n));
  return Math.SQRT2 * (centerR - apexFromCorner);
}

/**
 * Convert array of {x, y} points to SVG path "d" attribute.
 */
export function pointsToPath(points: Point[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return `M ${first!.x} ${first!.y} ` + rest.map((p) => `L ${p.x} ${p.y}`).join(" ");
}
```

- [ ] **Step 2: Delete `docs/math.mjs`**

```bash
git rm docs/math.mjs
```

- [ ] **Step 3: Commit**

```bash
git add docs/src/math.ts
git commit -m "refactor: convert math.mjs to TypeScript"
```

---

### Task 3: Move and convert `docs/demo.mjs` → `docs/src/demo.ts`

**Files:**
- Create: `docs/src/demo.ts`
- Delete: `docs/demo.mjs`

- [ ] **Step 1: Create `docs/src/demo.ts`**

Key TypeScript changes:
- Import from `./math.ts` (Vite resolves `.ts` imports)
- All `document.getElementById()` calls return `HTMLElement | null` — use non-null assertions (`!`) since these are known IDs in `index.html`
- Cast slider inputs to `HTMLInputElement` for `.value` access
- Type the helper function parameters

```typescript
import {
  correctedRadius,
  superellipsePoints,
  circleArcPoints,
  perceivedRadius,
  pointsToPath,
} from "./math.ts";

// ── Shared controls ──

const radiusSlider = document.getElementById("radius-slider") as HTMLInputElement;
const exponentSlider = document.getElementById("exponent-slider") as HTMLInputElement;
const correctionToggle = document.getElementById("correction-toggle")!;
const toggleTrack = document.getElementById("toggle-track")!;
const toggleKnob = document.getElementById("toggle-knob")!;
const correctionStatus = document.getElementById("correction-status")!;
const radiusValue = document.getElementById("radius-value")!;
const exponentValue = document.getElementById("exponent-value")!;

let correctionOn = true;

correctionToggle.addEventListener("click", () => {
  correctionOn = !correctionOn;
  correctionToggle.setAttribute("aria-checked", String(correctionOn));
  toggleTrack.className = correctionOn
    ? "w-11 h-6 bg-indigo-600 rounded-full relative transition-colors"
    : "w-11 h-6 bg-zinc-700 rounded-full relative transition-colors";
  toggleKnob.className = correctionOn
    ? "absolute top-0.5 left-[1.375rem] w-5 h-5 bg-white rounded-full transition-all"
    : "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all";
  update();
});

radiusSlider.addEventListener("input", update);
exponentSlider.addEventListener("input", update);

// ── Section 1: Overlay Comparison ──

const circleBox = document.getElementById("overlay-box-circle")!;
const squircleBox = document.getElementById("overlay-box-squircle")!;
const readoutCircleR = document.getElementById("readout-circle-r")!;
const readoutSquircleR = document.getElementById("readout-squircle-r")!;

function updateOverlay(r: number, cssN: number, mathN: number): void {
  const squircleR = correctionOn ? correctedRadius(r, mathN) : r;

  circleBox.style.borderTopRightRadius = `${r}px`;
  squircleBox.style.borderTopRightRadius = `${squircleR.toFixed(1)}px`;
  squircleBox.style.setProperty("corner-shape", `superellipse(${cssN})`);

  correctionStatus.textContent = correctionOn ? "ON" : "OFF";
  correctionStatus.className = correctionOn
    ? "text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded"
    : "text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded";
  readoutCircleR.textContent = String(r);
  readoutSquircleR.textContent = squircleR.toFixed(1);
}

// ── Section 2: Interactive Math Explorer ──

const svgEl = document.getElementById("math-svg")!;
const NS = "http://www.w3.org/2000/svg";

const BOX = 180;
const PAD = 10;
const cornerX = PAD + BOX;
const cornerY = PAD;

const boxRect = document.createElementNS(NS, "rect");
boxRect.setAttribute("x", String(PAD));
boxRect.setAttribute("y", String(PAD));
boxRect.setAttribute("width", String(BOX));
boxRect.setAttribute("height", String(BOX));
boxRect.setAttribute("fill", "none");
boxRect.setAttribute("stroke", "#3f3f46");
boxRect.setAttribute("stroke-width", "1");
svgEl.appendChild(boxRect);

const circlePath = document.createElementNS(NS, "path");
circlePath.setAttribute("fill", "none");
circlePath.setAttribute("stroke", "#ef4444");
circlePath.setAttribute("stroke-width", "2");
circlePath.setAttribute("stroke-dasharray", "4 3");
svgEl.appendChild(circlePath);

const superPath = document.createElementNS(NS, "path");
superPath.setAttribute("fill", "none");
superPath.setAttribute("stroke", "#6366f1");
superPath.setAttribute("stroke-width", "2");
svgEl.appendChild(superPath);

const corrPath = document.createElementNS(NS, "path");
corrPath.setAttribute("fill", "none");
corrPath.setAttribute("stroke", "#10b981");
corrPath.setAttribute("stroke-width", "2");
svgEl.appendChild(corrPath);

function makeDot(color: string): SVGCircleElement {
  const dot = document.createElementNS(NS, "circle");
  dot.setAttribute("r", "3.5");
  dot.setAttribute("fill", color);
  svgEl.appendChild(dot);
  return dot;
}

const cDotTop = makeDot("#ef4444");
const cDotRight = makeDot("#ef4444");
const sDotTop = makeDot("#6366f1");
const sDotRight = makeDot("#6366f1");
const corrDotTop = makeDot("#10b981");
const corrDotRight = makeDot("#10b981");

function arcToSvg(mathX: number, mathY: number, arcR: number): { x: number; y: number } {
  return { x: cornerX - arcR + mathX, y: cornerY + arcR - mathY };
}

function updateMathSvg(r: number, _cssN: number, mathN: number): void {
  const maxR = BOX;
  const clampedR = Math.min(r, maxR);
  const corrR = Math.min(correctedRadius(clampedR, mathN), maxR);

  // Circle
  const cArc = circleArcPoints(clampedR).map((p) => arcToSvg(p.x, p.y, clampedR));
  circlePath.setAttribute("d",
    `M ${cornerX} ${PAD + BOX} L ${cArc[0]!.x} ${cArc[0]!.y} ` +
    pointsToPath(cArc).slice(2) +
    ` L ${PAD} ${cornerY}`);

  // Superellipse at same radius
  const sArc = superellipsePoints(clampedR, mathN).map((p) => arcToSvg(p.x, p.y, clampedR));
  superPath.setAttribute("d",
    `M ${cornerX} ${PAD + BOX} L ${sArc[0]!.x} ${sArc[0]!.y} ` +
    pointsToPath(sArc).slice(2) +
    ` L ${PAD} ${cornerY}`);

  // Corrected superellipse
  const corrArc = superellipsePoints(corrR, mathN).map((p) => arcToSvg(p.x, p.y, corrR));
  corrPath.setAttribute("d",
    `M ${cornerX} ${PAD + BOX} L ${corrArc[0]!.x} ${corrArc[0]!.y} ` +
    pointsToPath(corrArc).slice(2) +
    ` L ${PAD} ${cornerY}`);

  // Junction dots
  const cFirst = cArc[0]!, cLast = cArc[cArc.length - 1]!;
  cDotRight.setAttribute("cx", String(cFirst.x)); cDotRight.setAttribute("cy", String(cFirst.y));
  cDotTop.setAttribute("cx", String(cLast.x));    cDotTop.setAttribute("cy", String(cLast.y));

  const sFirst = sArc[0]!, sLast = sArc[sArc.length - 1]!;
  sDotRight.setAttribute("cx", String(sFirst.x)); sDotRight.setAttribute("cy", String(sFirst.y));
  sDotTop.setAttribute("cx", String(sLast.x));    sDotTop.setAttribute("cy", String(sLast.y));

  const corrFirst = corrArc[0]!, corrLast = corrArc[corrArc.length - 1]!;
  corrDotRight.setAttribute("cx", String(corrFirst.x)); corrDotRight.setAttribute("cy", String(corrFirst.y));
  corrDotTop.setAttribute("cx", String(corrLast.x));    corrDotTop.setAttribute("cy", String(corrLast.y));

  // Readouts
  document.getElementById("formula-n")!.textContent = mathN.toFixed(1);
  document.getElementById("formula-r")!.textContent = String(r);
  document.getElementById("formula-result")!.textContent = correctedRadius(r, mathN).toFixed(1);

  const prc = perceivedRadius(clampedR, clampedR, 2);
  const prs = perceivedRadius(clampedR, clampedR, mathN);
  const prCorr = perceivedRadius(clampedR, corrR, mathN);

  document.getElementById("radius-circle")!.textContent = `${clampedR}px`;
  document.getElementById("radius-superellipse")!.textContent = `${clampedR}px`;
  document.getElementById("radius-corrected")!.textContent = `${corrR.toFixed(1)}px`;

  document.getElementById("bevel-circle")!.textContent = `${prc.toFixed(1)}px`;
  document.getElementById("bevel-superellipse")!.textContent = `${prs.toFixed(1)}px`;
  document.getElementById("bevel-corrected")!.textContent = `${prCorr.toFixed(1)}px`;

  const fmt = (v: number): string => `${v >= 0 ? "+" : ""}${v.toFixed(1)}px`;
  document.getElementById("diff-circle")!.textContent = fmt(prc - prc);
  document.getElementById("diff-superellipse")!.textContent = fmt(prs - prc);
  document.getElementById("diff-corrected")!.textContent = fmt(prCorr - prc);
}

// ── Unified update ──

function update(): void {
  const r = Number(radiusSlider.value);
  const cssN = Number(exponentSlider.value);
  const mathN = Math.pow(2, cssN);

  radiusValue.textContent = `${r}px`;
  exponentValue.textContent = `n = ${cssN}`;

  updateOverlay(r, cssN, mathN);
  updateMathSvg(r, cssN, mathN);
}

// Initialize
update();
```

- [ ] **Step 2: Delete `docs/demo.mjs`**

```bash
git rm docs/demo.mjs
```

- [ ] **Step 3: Commit**

```bash
git add docs/src/demo.ts
git commit -m "refactor: convert demo.mjs to TypeScript"
```

---

### Task 4: Move and convert `plugin.js` → `src/plugin.ts`

**Files:**
- Create: `src/plugin.ts`
- Delete: `plugin.js`

- [ ] **Step 1: Create `src/plugin.ts`**

The Tailwind plugin API uses `matchUtilities` which accepts string values. The `correctedRadius` helper returns a CSS `calc()` string. Type annotations are minimal — mainly the function parameter and the plugin callback.

```typescript
import plugin from "tailwindcss/plugin";

const correctedRadius = (value: string): string =>
  `calc(${value} * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 1.5)))))`;

const cornerShape = "superellipse(var(--squircle-amt, 1.5))";

const supportsCornerShape = "@supports (corner-shape: superellipse())";

export default plugin(function ({ matchUtilities, theme }) {
  const radiusValues = theme("borderRadius");

  // squircle-amt-* — sets exponent + corner-shape
  matchUtilities(
    {
      "squircle-amt": (value: string) => ({
        "--squircle-amt": value,
        [supportsCornerShape]: {
          "corner-shape": "superellipse(var(--squircle-amt))",
        },
      }),
    },
    { type: "number" },
  );

  // squircle-* — all corners
  matchUtilities(
    {
      squircle: (value: string) => ({
        "border-radius": value,
        [supportsCornerShape]: {
          "--squircle-r": correctedRadius(value),
          "border-radius": "var(--squircle-r)",
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  // --- Per-side physical variants ---

  matchUtilities(
    {
      "squircle-t": (value: string) => ({
        "border-top-left-radius": value,
        "border-top-right-radius": value,
        [supportsCornerShape]: {
          "--squircle-r": correctedRadius(value),
          "border-top-left-radius": "var(--squircle-r)",
          "border-top-right-radius": "var(--squircle-r)",
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  matchUtilities(
    {
      "squircle-r": (value: string) => ({
        "border-top-right-radius": value,
        "border-bottom-right-radius": value,
        [supportsCornerShape]: {
          "--squircle-r": correctedRadius(value),
          "border-top-right-radius": "var(--squircle-r)",
          "border-bottom-right-radius": "var(--squircle-r)",
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  matchUtilities(
    {
      "squircle-b": (value: string) => ({
        "border-bottom-left-radius": value,
        "border-bottom-right-radius": value,
        [supportsCornerShape]: {
          "--squircle-r": correctedRadius(value),
          "border-bottom-left-radius": "var(--squircle-r)",
          "border-bottom-right-radius": "var(--squircle-r)",
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  matchUtilities(
    {
      "squircle-l": (value: string) => ({
        "border-top-left-radius": value,
        "border-bottom-left-radius": value,
        [supportsCornerShape]: {
          "--squircle-r": correctedRadius(value),
          "border-top-left-radius": "var(--squircle-r)",
          "border-bottom-left-radius": "var(--squircle-r)",
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  // --- Per-side logical variants ---

  matchUtilities(
    {
      "squircle-s": (value: string) => ({
        "border-start-start-radius": value,
        "border-end-start-radius": value,
        [supportsCornerShape]: {
          "--squircle-r": correctedRadius(value),
          "border-start-start-radius": "var(--squircle-r)",
          "border-end-start-radius": "var(--squircle-r)",
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  matchUtilities(
    {
      "squircle-e": (value: string) => ({
        "border-start-end-radius": value,
        "border-end-end-radius": value,
        [supportsCornerShape]: {
          "--squircle-r": correctedRadius(value),
          "border-start-end-radius": "var(--squircle-r)",
          "border-end-end-radius": "var(--squircle-r)",
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  // --- Per-corner physical variants (direct calc, no intermediate variable) ---

  matchUtilities(
    {
      "squircle-tl": (value: string) => ({
        "border-top-left-radius": value,
        [supportsCornerShape]: {
          "border-top-left-radius": correctedRadius(value),
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  matchUtilities(
    {
      "squircle-tr": (value: string) => ({
        "border-top-right-radius": value,
        [supportsCornerShape]: {
          "border-top-right-radius": correctedRadius(value),
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  matchUtilities(
    {
      "squircle-br": (value: string) => ({
        "border-bottom-right-radius": value,
        [supportsCornerShape]: {
          "border-bottom-right-radius": correctedRadius(value),
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  matchUtilities(
    {
      "squircle-bl": (value: string) => ({
        "border-bottom-left-radius": value,
        [supportsCornerShape]: {
          "border-bottom-left-radius": correctedRadius(value),
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  // --- Per-corner logical variants (direct calc, no intermediate variable) ---

  matchUtilities(
    {
      "squircle-ss": (value: string) => ({
        "border-start-start-radius": value,
        [supportsCornerShape]: {
          "border-start-start-radius": correctedRadius(value),
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  matchUtilities(
    {
      "squircle-se": (value: string) => ({
        "border-start-end-radius": value,
        [supportsCornerShape]: {
          "border-start-end-radius": correctedRadius(value),
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  matchUtilities(
    {
      "squircle-es": (value: string) => ({
        "border-end-start-radius": value,
        [supportsCornerShape]: {
          "border-end-start-radius": correctedRadius(value),
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  matchUtilities(
    {
      "squircle-ee": (value: string) => ({
        "border-end-end-radius": value,
        [supportsCornerShape]: {
          "border-end-end-radius": correctedRadius(value),
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );
});
```

- [ ] **Step 2: Delete `plugin.js`**

```bash
git rm plugin.js
```

- [ ] **Step 3: Commit**

```bash
git add src/plugin.ts
git commit -m "refactor: convert plugin.js to TypeScript"
```

---

### Task 5: Move and convert `merge.js` → `src/merge.ts`

**Files:**
- Create: `src/merge.ts`
- Delete: `merge.js`

- [ ] **Step 1: Create `src/merge.ts`**

```typescript
const allRoundedGroups: string[] = [
  "rounded",
  "rounded-s",
  "rounded-e",
  "rounded-t",
  "rounded-r",
  "rounded-b",
  "rounded-l",
  "rounded-ss",
  "rounded-se",
  "rounded-es",
  "rounded-ee",
  "rounded-tl",
  "rounded-tr",
  "rounded-br",
  "rounded-bl",
];

export const squircleMergeConfig = {
  extend: {
    classGroups: {
      squircle: [
        { squircle: [() => true] },
        { "squircle-t": [() => true] },
        { "squircle-r": [() => true] },
        { "squircle-b": [() => true] },
        { "squircle-l": [() => true] },
        { "squircle-s": [() => true] },
        { "squircle-e": [() => true] },
        { "squircle-tl": [() => true] },
        { "squircle-tr": [() => true] },
        { "squircle-br": [() => true] },
        { "squircle-bl": [() => true] },
        { "squircle-ss": [() => true] },
        { "squircle-se": [() => true] },
        { "squircle-es": [() => true] },
        { "squircle-ee": [() => true] },
      ],
      "squircle-amt": [{ "squircle-amt": [() => true] }],
    },
    conflictingClassGroups: {
      squircle: [...allRoundedGroups, "squircle-amt"],
      ...Object.fromEntries(
        allRoundedGroups.map((g) => [g, ["squircle", "squircle-amt"]]),
      ),
    },
  },
} as const;
```

- [ ] **Step 2: Delete `merge.js`**

```bash
git rm merge.js
```

- [ ] **Step 3: Commit**

```bash
git add src/merge.ts
git commit -m "refactor: convert merge.js to TypeScript"
```

---

### Task 6: Move `squircle.css` → `src/squircle.css`

**Files:**
- Move: `squircle.css` → `src/squircle.css`

- [ ] **Step 1: Move the file**

```bash
git mv squircle.css src/squircle.css
```

- [ ] **Step 2: Commit**

```bash
git commit -m "refactor: move squircle.css into src/"
```

---

### Task 7: Update `vite.config.ts` with pack config and Tailwind plugin

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Update `vite.config.ts`**

Add `pack` config for library build and `@tailwindcss/vite` for demo site. Preserve all existing `staged`, `fmt`, and `lint` config.

```typescript
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [tailwindcss()],
  pack: {
    entry: {
      plugin: "./src/plugin.ts",
      merge: "./src/merge.ts",
    },
    format: "esm",
    dts: true,
  },
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ignorePatterns: [],
    sortTailwindcss: {
      stylesheet: "./docs/styles.css",
    },
  },
  lint: {
    plugins: ["typescript", "unicorn", "oxc"],
    categories: {
      correctness: "error",
    },
    rules: {},
    env: {
      builtin: true,
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add vite.config.ts
git commit -m "feat: add pack config and Tailwind Vite plugin"
```

---

### Task 8: Update `package.json` — exports, scripts, dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update `package.json`**

Changes:
- `exports` point to `dist/` with `types` conditions
- `files` field becomes `["dist"]`
- Scripts use `vp` commands and `--root docs`
- Swap `@tailwindcss/cli` for `@tailwindcss/vite`
- Add `prepublishOnly`

```json
{
  "name": "@klinking/tw-squircle",
  "version": "0.1.0",
  "type": "module",
  "description": "Tailwind CSS v4 squircle (superellipse) corner utilities with visual radius correction",
  "license": "MIT",
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
  "files": [
    "dist"
  ],
  "peerDependencies": {
    "tailwind-merge": ">=2.0.0",
    "tailwindcss": ">=4.0.0"
  },
  "peerDependenciesMeta": {
    "tailwind-merge": {
      "optional": true
    }
  },
  "keywords": [
    "tailwindcss",
    "squircle",
    "superellipse",
    "border-radius",
    "corner-shape",
    "tailwind-plugin"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/dogmar/tw-squircle"
  },
  "homepage": "https://dogmar.github.io/tw-squircle",
  "scripts": {
    "dev": "vite --root docs",
    "build": "vp pack && cp src/squircle.css dist/squircle.css",
    "build:site": "vite build --root docs",
    "prepare": "vp config",
    "lint": "vp lint",
    "lint:fix": "vp lint --fix",
    "fmt": "vp fmt",
    "fmt:check": "vp fmt --check",
    "sync-readme": "./scripts/sync-readme.sh",
    "prepublishOnly": "npm run build"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.2.2",
    "oxlint": "^1.58.0"
  }
}
```

Note: `vite-plus` and `vite` are managed via the pnpm catalog in `pnpm-workspace.yaml`, so they don't appear in `devDependencies` directly.

- [ ] **Step 2: Install dependencies**

```bash
pnpm install
```

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: update package.json for Vite Plus migration"
```

---

### Task 9: Update `docs/index.html` and `docs/styles.css`

**Files:**
- Modify: `docs/index.html`
- Modify: `docs/styles.css`
- Delete: `docs/dist.css`

- [ ] **Step 1: Update `docs/index.html`**

Two changes:
1. Line 7: `<link rel="stylesheet" href="dist.css">` → `<link rel="stylesheet" href="styles.css">`
2. Line 149: `<script type="module" src="demo.mjs">` → `<script type="module" src="src/demo.ts">`

- [ ] **Step 2: Update `docs/styles.css`**

Change the Tailwind v4 `@plugin` directive path:

```css
@import "tailwindcss";
@plugin "../src/plugin.ts";
```

- [ ] **Step 3: Delete `docs/dist.css`**

```bash
git rm docs/dist.css
```

- [ ] **Step 4: Commit**

```bash
git add docs/index.html docs/styles.css
git commit -m "feat: update docs to use Vite dev server and TS sources"
```

---

### Task 10: Verify dev server and library build

- [ ] **Step 1: Start dev server and verify it works**

```bash
pnpm run dev
```

Expected: Vite dev server starts, serves the demo at `http://localhost:5173`. Open in browser and verify the interactive demo renders correctly with sliders, SVG visualization, and overlay comparison.

- [ ] **Step 2: Build the library**

```bash
pnpm run build
```

Expected: `dist/` directory is created with `plugin.js`, `plugin.d.ts`, `merge.js`, `merge.d.ts`, `squircle.css`.

- [ ] **Step 3: Build the site**

```bash
pnpm run build:site
```

Expected: Built demo site output (HTML, CSS, JS) in the Vite output directory.

- [ ] **Step 4: Fix any TypeScript or build errors**

If `exactOptionalPropertyTypes` or other strict settings cause issues with Tailwind's plugin types, adjust the type annotations (e.g., add explicit casts) rather than loosening the tsconfig.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build issues from migration"
```

---

### Task 11: Update sync-readme script and workflow

**Files:**
- Modify: `scripts/sync-readme.sh`
- Modify: `.github/workflows/sync-readme.yml`
- Modify: `README.md` (markers)

- [ ] **Step 1: Update `scripts/sync-readme.sh`**

Update the three `sync_file` calls at the bottom to read from `src/` and use `ts` language tags:

```bash
sync_file "src/squircle.css" "css"
sync_file "src/merge.ts" "ts"
sync_file "src/plugin.ts" "ts"
```

- [ ] **Step 2: Update README.md markers**

Find and replace in `README.md`:
- `<!-- BEGIN:squircle.css -->` → `<!-- BEGIN:src/squircle.css -->`
- `<!-- END:squircle.css -->` → `<!-- END:src/squircle.css -->`
- `<!-- BEGIN:merge.js -->` → `<!-- BEGIN:src/merge.ts -->`
- `<!-- END:merge.js -->` → `<!-- END:src/merge.ts -->`
- `<!-- BEGIN:plugin.js -->` → `<!-- BEGIN:src/plugin.ts -->`
- `<!-- END:plugin.js -->` → `<!-- END:src/plugin.ts -->`

- [ ] **Step 3: Run the sync script to verify**

```bash
pnpm run sync-readme
```

Expected: "README synced." with code blocks updated to TypeScript content.

- [ ] **Step 4: Update `.github/workflows/sync-readme.yml`**

Update the `paths` filter and add pnpm setup:

```yaml
name: Sync README code blocks

on:
  push:
    branches: [main]
    paths:
      - src/squircle.css
      - src/merge.ts
      - src/plugin.ts

jobs:
  sync:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - name: Run sync script
        run: ./scripts/sync-readme.sh

      - name: Commit if changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git diff --quiet README.md || {
            git add README.md
            git commit -m "docs: sync README code blocks"
            git push
          }
```

- [ ] **Step 5: Commit**

```bash
git add scripts/sync-readme.sh .github/workflows/sync-readme.yml README.md
git commit -m "chore: update sync-readme for src/ paths and TypeScript"
```

---

### Task 12: Add GitHub Pages deploy workflow

**Files:**
- Create: `.github/workflows/deploy-site.yml`

- [ ] **Step 1: Create `.github/workflows/deploy-site.yml`**

```yaml
name: Deploy demo site

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm run build:site

      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Note: The `docs/dist` path assumes `vite build --root docs` outputs to `docs/dist` by default. Verify this during Task 10 and adjust if needed (may need `build.outDir` in vite config).

- [ ] **Step 2: Create `docs/CNAME` if it doesn't exist**

Check if `docs/CNAME` exists. If the site uses a custom domain, this file should contain the domain name. If GitHub Pages uses the default `*.github.io` URL, this file is not needed. Check the repo settings or ask.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy-site.yml
git commit -m "ci: add GitHub Pages deploy workflow"
```

---

### Task 13: Clean up old files

**Files:**
- Delete: `scripts/serve.mjs`
- Delete: `.oxlintrc.json` (if present — config now in `vite.config.ts`)
- Delete: `.oxfmtrc.json` (if present — config now in `vite.config.ts`)

- [ ] **Step 1: Remove old files**

```bash
git rm scripts/serve.mjs
git rm -f .oxlintrc.json .oxfmtrc.json
```

- [ ] **Step 2: Verify nothing references the deleted files**

```bash
grep -r "serve.mjs\|\.oxlintrc\|\.oxfmtrc" --include="*.json" --include="*.ts" --include="*.yml" --include="*.sh" .
```

Expected: no matches.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove old dev server and standalone lint/fmt configs"
```

---

### Task 14: Final verification

- [ ] **Step 1: Run full lint**

```bash
pnpm run lint
```

Expected: no errors.

- [ ] **Step 2: Run format check**

```bash
pnpm run fmt:check
```

Expected: no formatting issues (or run `pnpm run fmt` to fix).

- [ ] **Step 3: Run dev server**

```bash
pnpm run dev
```

Expected: demo site loads and works interactively.

- [ ] **Step 4: Run library build**

```bash
pnpm run build
```

Expected: `dist/` contains `plugin.js`, `plugin.d.ts`, `merge.js`, `merge.d.ts`, `squircle.css`.

- [ ] **Step 5: Run site build**

```bash
pnpm run build:site
```

Expected: built site output ready for deployment.

- [ ] **Step 6: Commit any remaining fixes**

```bash
git add -A
git commit -m "chore: final migration cleanup"
```
