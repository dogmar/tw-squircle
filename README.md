# @klinking/tw-squircle

Tailwind CSS v4 squircle (superellipse) corner utilities with visual radius correction.

[![npm version](https://img.shields.io/npm/v/@klinking/tw-squircle.svg)](https://www.npmjs.com/package/@klinking/tw-squircle)

> **[Interactive Demo →](https://dogmar.github.io/tw-squircle)**

## Install

```bash
npm install @klinking/tw-squircle
```

## Usage

**CSS import** (recommended):

```css
@import "@klinking/tw-squircle/squircle.css";
```

**JS plugin** (alternative):

```css
@plugin "@klinking/tw-squircle/plugin";
```

**tw-merge** (optional — if you use tailwind-merge):

```js
import { squircleMergeConfig } from "@klinking/tw-squircle/merge";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge(squircleMergeConfig, {
  // your other customizations
});
```

## What it does

CSS `corner-shape: superellipse()` makes corners follow a superellipse curve instead of a circular arc. But at the same `border-radius` value, superellipse corners look visually smaller. This package auto-adjusts the radius so `squircle-lg` visually matches `rounded-lg`.

The correction formula:

$$r' = r \cdot \frac{1 - 2^{-\frac{1}{2}}}{1 - 2^{-\frac{1}{n}}}$$

where $n = 2^K$ and $K$ is the CSS `superellipse()` parameter.

See the [interactive demo](https://dogmar.github.io/tw-squircle) for a visual explanation.

## Utilities

| Utility | Equivalent | Description |
|---------|-----------|-------------|
| `squircle-*` | `rounded-*` | All corners |
| `squircle-t-*` | `rounded-t-*` | Top corners |
| `squircle-r-*` | `rounded-r-*` | Right corners |
| `squircle-b-*` | `rounded-b-*` | Bottom corners |
| `squircle-l-*` | `rounded-l-*` | Left corners |
| `squircle-tl-*` | `rounded-tl-*` | Top-left corner |
| `squircle-tr-*` | `rounded-tr-*` | Top-right corner |
| `squircle-br-*` | `rounded-br-*` | Bottom-right corner |
| `squircle-bl-*` | `rounded-bl-*` | Bottom-left corner |
| `squircle-amt-*` | — | Superellipse exponent (default 1.5) |

All `squircle-*` utilities accept the same values as `rounded-*` (`sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `full`, arbitrary `[16px]`).

`squircle-amt-*` accepts a number (`squircle-amt-[2]`, `squircle-amt-[3.5]`). Higher values = more square.

## Copy/Paste

If you'd rather not add a dependency, copy the source directly:

### squircle.css

<!-- BEGIN:squircle.css -->
```css
/* ── Squircle utilities ─────────────────────────────────────── */
/* squircle-amt-[n] sets the superellipse amount (default 1.5)  */
/* squircle-* mirrors rounded-* variants: all, t, r, b, l, tl, tr, br, bl */

@utility squircle-amt-* {
  --squircle-amt: --value(--squircle-amt-*, number);
  corner-shape: superellipse(var(--squircle-amt));
}

@utility squircle-* {
  --squircle-r: calc(
    --value(--radius-*) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 1.5))))
  );
  border-radius: var(--squircle-r);
  corner-shape: superellipse(var(--squircle-amt, 1.5));
}

@utility squircle-t-* {
  --squircle-r: calc(
    --value(--radius-*) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 1.5))))
  );
  border-top-left-radius: var(--squircle-r);
  border-top-right-radius: var(--squircle-r);
  corner-shape: superellipse(var(--squircle-amt, 1.5));
}

@utility squircle-r-* {
  --squircle-r: calc(
    --value(--radius-*) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 1.5))))
  );
  border-top-right-radius: var(--squircle-r);
  border-bottom-right-radius: var(--squircle-r);
  corner-shape: superellipse(var(--squircle-amt, 1.5));
}

@utility squircle-b-* {
  --squircle-r: calc(
    --value(--radius-*) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 1.5))))
  );
  border-bottom-left-radius: var(--squircle-r);
  border-bottom-right-radius: var(--squircle-r);
  corner-shape: superellipse(var(--squircle-amt, 1.5));
}

@utility squircle-l-* {
  --squircle-r: calc(
    --value(--radius-*) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 1.5))))
  );
  border-top-left-radius: var(--squircle-r);
  border-bottom-left-radius: var(--squircle-r);
  corner-shape: superellipse(var(--squircle-amt, 1.5));
}

@utility squircle-tl-* {
  border-top-left-radius: calc(
    --value(--radius-*) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 1.5))))
  );
  corner-shape: superellipse(var(--squircle-amt, 1.5));
}

@utility squircle-tr-* {
  border-top-right-radius: calc(
    --value(--radius-*) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 1.5))))
  );
  corner-shape: superellipse(var(--squircle-amt, 1.5));
}

@utility squircle-br-* {
  border-bottom-right-radius: calc(
    --value(--radius-*) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 1.5))))
  );
  corner-shape: superellipse(var(--squircle-amt, 1.5));
}

@utility squircle-bl-* {
  border-bottom-left-radius: calc(
    --value(--radius-*) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 1.5))))
  );
  corner-shape: superellipse(var(--squircle-amt, 1.5));
}
```
<!-- END:squircle.css -->

### plugin.js

<!-- BEGIN:plugin.js -->
```js
import plugin from "tailwindcss/plugin";

const correctedRadius = (value) =>
  `calc(${value} * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 1.5)))))`;

const cornerShape = "superellipse(var(--squircle-amt, 1.5))";

export default plugin(function ({ matchUtilities, theme }) {
  const radiusValues = theme("borderRadius");

  // squircle-amt-* — sets exponent + corner-shape
  matchUtilities(
    {
      "squircle-amt": (value) => ({
        "--squircle-amt": value,
        "corner-shape": "superellipse(var(--squircle-amt))",
      }),
    },
    { type: "number" },
  );

  // squircle-* — all corners (uses intermediate --squircle-r variable)
  matchUtilities(
    {
      squircle: (value) => ({
        "--squircle-r": correctedRadius(value),
        "border-radius": "var(--squircle-r)",
        "corner-shape": cornerShape,
      }),
    },
    { type: "length", values: radiusValues },
  );

  // --- Per-side variants (use intermediate --squircle-r variable) ---

  // squircle-t-* — top-left + top-right
  matchUtilities(
    {
      "squircle-t": (value) => ({
        "--squircle-r": correctedRadius(value),
        "border-top-left-radius": "var(--squircle-r)",
        "border-top-right-radius": "var(--squircle-r)",
        "corner-shape": cornerShape,
      }),
    },
    { type: "length", values: radiusValues },
  );

  // squircle-r-* — top-right + bottom-right
  matchUtilities(
    {
      "squircle-r": (value) => ({
        "--squircle-r": correctedRadius(value),
        "border-top-right-radius": "var(--squircle-r)",
        "border-bottom-right-radius": "var(--squircle-r)",
        "corner-shape": cornerShape,
      }),
    },
    { type: "length", values: radiusValues },
  );

  // squircle-b-* — bottom-left + bottom-right
  matchUtilities(
    {
      "squircle-b": (value) => ({
        "--squircle-r": correctedRadius(value),
        "border-bottom-left-radius": "var(--squircle-r)",
        "border-bottom-right-radius": "var(--squircle-r)",
        "corner-shape": cornerShape,
      }),
    },
    { type: "length", values: radiusValues },
  );

  // squircle-l-* — top-left + bottom-left
  matchUtilities(
    {
      "squircle-l": (value) => ({
        "--squircle-r": correctedRadius(value),
        "border-top-left-radius": "var(--squircle-r)",
        "border-bottom-left-radius": "var(--squircle-r)",
        "corner-shape": cornerShape,
      }),
    },
    { type: "length", values: radiusValues },
  );

  // --- Per-corner variants (NO intermediate variable, direct calc) ---

  // squircle-tl-*
  matchUtilities(
    {
      "squircle-tl": (value) => ({
        "border-top-left-radius": correctedRadius(value),
        "corner-shape": cornerShape,
      }),
    },
    { type: "length", values: radiusValues },
  );

  // squircle-tr-*
  matchUtilities(
    {
      "squircle-tr": (value) => ({
        "border-top-right-radius": correctedRadius(value),
        "corner-shape": cornerShape,
      }),
    },
    { type: "length", values: radiusValues },
  );

  // squircle-br-*
  matchUtilities(
    {
      "squircle-br": (value) => ({
        "border-bottom-right-radius": correctedRadius(value),
        "corner-shape": cornerShape,
      }),
    },
    { type: "length", values: radiusValues },
  );

  // squircle-bl-*
  matchUtilities(
    {
      "squircle-bl": (value) => ({
        "border-bottom-left-radius": correctedRadius(value),
        "corner-shape": cornerShape,
      }),
    },
    { type: "length", values: radiusValues },
  );
});
```
<!-- END:plugin.js -->

### merge.js

<!-- BEGIN:merge.js -->
```js
const allRoundedGroups = [
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
        { "squircle-tl": [() => true] },
        { "squircle-tr": [() => true] },
        { "squircle-br": [() => true] },
        { "squircle-bl": [() => true] },
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
};
```
<!-- END:merge.js -->

## Browser Support

`corner-shape: superellipse()` is a new CSS property. Check [caniuse](https://caniuse.com/?search=corner-shape) for current browser support. In unsupported browsers, the corners degrade gracefully to regular `border-radius` — the superellipse shape is simply ignored.

## License

MIT
