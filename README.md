# @klinking/squircle

[![npm version](https://img.shields.io/npm/v/@klinking/squircle.svg)](https://www.npmjs.com/package/@klinking/squircle)

We're all excited about `corner-shape: squircle`, but we're in a pickle right now. Squircle corners look _better_ (natch), but at the same `border-radius`, they look _itty bitty_ compared to regular rounded corners. You're saying to yourself: "Who cares! I'll just crank up the border-radius until it look good and be done with it!" Then you see your site in Safari, and now your rounded corners are just _massive_. That's because Safari ain't supportin' no squircles yet. Now you gotta manually eyeball what border-radius kinda looks the same as the squircle and throw in an `@supports` rule and then your head explodes (why, head, why you explode?). Well… what if I told you you could eat your squircle and have your border-radius too? Read on, child.

> **[Interactive Demo →](https://dogmar.github.io/squircle)**

## Contents

<!-- BEGIN:toc -->

- [Requirements](#requirements)
- [Install & setup](#install--setup)
- [Utilities](#utilities)
- [Configuring theme tokens](#configuring-theme-tokens)
- [CSS function: `squircle-radius()`](#css-function-squircle-radius)
- [How the radius correction works](#how-the-radius-correction-works)
- [Browser support & fallback strategy](#browser-support--fallback-strategy)
- [Why it called "squircle" when it use "superellipse()"?](#why-it-called-squircle-when-it-use-superellipse)
- [Alternatives considered](#alternatives-considered)
- [Should you install or copy/paste?](#should-you-install-or-copypaste)
- [FAQ](#faq)
- [Copy/paste source](#copypaste-source)
- [Prior art & credits](#prior-art--credits)
- [License](#license)
<!-- END:toc -->

## Requirements

- **Tailwind CSS v4+.** The CSS utilities use v4's `@utility` and `--value()` APIs. The JS plugin is API-compatible with v3 but only tested and declared against v4 — see [FAQ](#faq) if you want to try it on v3.
- **Modern browsers** for the squircle shape itself. Unsupported browsers get a clean `border-radius` fallback that matches visual size of rounding; see [Browser support](#browser-support--fallback-strategy) for the feature-by-feature matrix.
- **Optional:** [`tailwind-merge`](https://github.com/dcastil/tailwind-merge) v2+ if your project already uses it (extra config below).
- **Optional:** CSS `@function` support if you use the standalone [`squircle-radius()`](#css-function-squircle-radius) — experimental.

<!-- Uncomment once the converter at squircle.klink.ing is live:
- **"I just want to convert one little ol' border-radius to one squircle!"** Well, then just [go here](https://squircle.klink.ing).
-->

## Install & setup

```bash
npm install @klinking/squircle
```

Then pick one of two integration paths. But don't pick wrong, else the Integration Ogre might… oh wait, no, just pick the one that suits your needs, they're essentially the same, but one allows more customization, in case my vars and classes conflict with ur existing vars and classes.

### Path A: CSS import (recommended)

```css
@import "tailwindcss";
@import "@klinking/squircle/tw-utils.css";
```

That's it. All `squircle-*` classes are available. This path uses Tailwind v4's `@utility` directive, so everything is generated at build time with zero runtime cost.

### Path B: JS plugin (for customization)

Use this if you want to change the class prefix or the `--squircle-amt` CSS variable name:

```css
@import "tailwindcss";
@plugin "@klinking/squircle/tw-plugin";
```

Or with options:

```css
@import "tailwindcss";
@plugin "@klinking/squircle/tw-plugin" {
  prefix: sq;          /* use `sq-md`, `sq-t-lg`, etc. */
  amt-var: --my-amt;   /* use `--my-amt` instead of `--squircle-amt` */
}
```

See [Configuring theme tokens](#configuring-theme-tokens) for what else you can customize.

### tailwind-merge (optional)

If your project already uses [`tailwind-merge`](https://github.com/dcastil/tailwind-merge) to de-duplicate conflicting classes, pull in the squircle conflict config so `rounded-lg squircle-md` resolves the way you'd expect:

```js
import { squircleMergeConfig } from "@klinking/squircle/tw-merge-cfg";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge(squircleMergeConfig, {
  // your other customizations
});
```

## Utilities

| Utility          | Equivalent     | Description                       |
| ---------------- | -------------- | --------------------------------- |
| `squircle-*`     | `rounded-*`    | All corners                       |
| `squircle-t-*`   | `rounded-t-*`  | Top corners                       |
| `squircle-r-*`   | `rounded-r-*`  | Right corners                     |
| `squircle-b-*`   | `rounded-b-*`  | Bottom corners                    |
| `squircle-l-*`   | `rounded-l-*`  | Left corners                      |
| `squircle-s-*`   | `rounded-s-*`  | Inline-start corners (logical)    |
| `squircle-e-*`   | `rounded-e-*`  | Inline-end corners (logical)      |
| `squircle-tl-*`  | `rounded-tl-*` | Top-left corner                   |
| `squircle-tr-*`  | `rounded-tr-*` | Top-right corner                  |
| `squircle-br-*`  | `rounded-br-*` | Bottom-right corner               |
| `squircle-bl-*`  | `rounded-bl-*` | Bottom-left corner                |
| `squircle-ss-*`  | `rounded-ss-*` | Start-start corner (logical)      |
| `squircle-se-*`  | `rounded-se-*` | Start-end corner (logical)        |
| `squircle-es-*`  | `rounded-es-*` | End-start corner (logical)        |
| `squircle-ee-*`  | `rounded-ee-*` | End-end corner (logical)          |
| `squircle-amt-*` | —              | Superellipse exponent (default 2) |

### What values are accepted?

Values are validated strictly so typos fail at build time instead of producing invalid CSS:

- **`squircle-*` and its variants** accept the same theme values as `rounded-*` (`sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `full`, plus anything you add to `@theme`) and arbitrary lengths like `squircle-[16px]`. Non-length arbitraries (`[50%]`, `[foo]`) and paren refs (`squircle-(--my-radius)`) are rejected — use a theme key instead (see [Configuring theme tokens](#configuring-theme-tokens)).
- **`squircle-amt-*`** accepts bare numbers (`squircle-amt-2`), arbitrary numbers (`squircle-amt-[3.5]`), and theme values. Unit-bearing arbitraries (`[1em]`) and paren refs (`(--my-amt)`) are rejected.

### What does `squircle-amt-*` control?

The value is the `K` parameter passed to `superellipse(K)`, which controls how square the corner shape is:

- **2** — the classic squircle (this package's default), same as the `squircle` keyword. Values greater than 2 get more and more square as they increase, becoming visually indistinguishable from a perfect square around 10 or higher.
- **1** — ordinary ellipse (same as the `round` keyword). The _classic_. Just like standard `border-radius`, no squircling at all. Why are you even here?
- **0** — straight bevel (same as the `bevel` keyword)
- **Negative values** — concave "scooped out" corners (`-1` = `scoop`, `-∞` = `notch`)

See the [MDN reference for `superellipse()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/superellipse) for the full spec.

## Configuring theme tokens

Everything that `squircle-*` and `squircle-amt-*` accept is driven by Tailwind's `@theme` block, so configuration is standard Tailwind — no special knobs.

### Custom radius sizes

Any `--radius-*` token you define works automatically:

```css
@theme {
  --radius-hero: 2.5rem;
  --radius-blob: 48px;
}
```

```html
<div class="squircle-hero">…</div>
<div class="squircle-blob">…</div>
```

### Default superellipse amount

`--squircle-amt` is a regular CSS custom property — set it anywhere it'll be in scope and it overrides the default of `2` for every `squircle-*` and `squircle-amt-*` utility beneath it:

```css
:root {
  --squircle-amt: 3;
}

/* or scoped to a subtree: */
.hero {
  --squircle-amt: 2.5;
}
```

Individual elements can still override with `squircle-amt-*` classes.

### Referencing a runtime CSS variable

Paren refs like `squircle-(--my-radius)` or `squircle-amt-(--my-amt)` are intentionally rejected (poor things). Tailwind can't distinguish them from unit-typo brackets like `squircle-amt-[1em]` at the validation level, so allowing one means allowing the other. Thread the var through a theme key instead (or, y'know, fork this repo, or tell me I'm wrong, and maybe I'll change):

```css
@theme {
  --radius-hero: var(--hero-radius);
  --squircle-amt-hero: var(--hero-squircle-amt);
}
```

```html
<div class="squircle-hero squircle-amt-hero">…</div>
```

Tailwind resolves the theme key, which reads your underlying CSS variable — you get the runtime indirection, the validator still catches typos.

### JS plugin options

If you installed via Path B, three options tune the emitted output:

| Option    | Default            | Effect                                                             |
| --------- | ------------------ | ------------------------------------------------------------------ |
| `prefix`  | `"squircle"`       | Class prefix. `prefix: "sq"` → `sq-md`, `sq-t-lg`                  |
| `amt-var` | `"--squircle-amt"` | CSS variable name for the `K` parameter passed to `superellipse()` |
| `r-var`   | `"--squircle-r"`   | CSS variable name for the intermediate corrected-radius variable   |

All three are exposed as kebab-case inside the `@plugin` block and as camelCase (`amtVar`, `rVar`) when requiring the plugin from JavaScript.

## CSS function: `squircle-radius()`

> ⚠️ **Experimental.** CSS `@function` is in [CSS Values 5](https://drafts.csswg.org/css-values-5/#custom-functions) and enabled behind a flag in recent Chrome. Check current support on [caniuse](https://caniuse.com/?search=%40function). For the same correction in today's browsers, use the Tailwind utilities — they expand to inline `calc()` that has been supported for years.

For the footure. Less total CSS than all those tailwind utilities. So beautiful. So utterly currently unusable.

```css
@import "@klinking/squircle/squircle-radius.css";

.card {
  --squircle-amt: 2;
  border-radius: squircle-radius(1rem, var(--squircle-amt));
  corner-shape: superellipse(var(--squircle-amt));
}
```

Arguments:

- `--radius` — the target `<length>` (what you'd have passed to `border-radius`)
- `--squircle-amt` — the `K` value you're passing to `superellipse()`

The parameters are deliberately untyped so relative units (`em`, `rem`, container queries, etc.) resolve at the call site, not at function-definition time — matching how CSS custom properties normally propagate.

**Heads up:** this doesn't supply the uncorrected fallback for browsers that have `@function` but lack `corner-shape`. By the time `@function` support is widespread, `corner-shape` probably will be too, so ¯\\\_(ツ)\_/¯.

## How the radius correction works

A superellipse at the same outer `border-radius` as a circular arc pokes further into the corner. The fix is to scale the radius up by some maths, so the _apparent_ roundness matches what you'd get from `rounded-*`. That is, the distance from the corner to the maximum pokage will match for both the superelliptical corner and the circular corner.

The correction formula:

$$r' = r \cdot \frac{1 - 2^{-\frac{1}{2}}}{1 - 2^{-\frac{1}{n}}}$$

where $n = 2^K$ and $K$ is the value you pass to `superellipse(K)` (same K as [`squircle-amt-*`](#what-does-squircle-amt--control)).

### Worked example: `squircle-md`

With the default Tailwind `--radius-md: 0.375rem` and the default `--squircle-amt: 2` (so `K = 2`, `n = 4`):

$$r' = 0.375\text{rem} \cdot \frac{1 - 2^{-1/2}}{1 - 2^{-1/4}} \approx 0.375\text{rem} \cdot 1.840 \approx 0.690\text{rem}$$

So `.squircle-md` compiles to roughly:

```css
.squircle-md {
  border-radius: 0.375rem; /* fallback: matches rounded-md visually */
  @supports (corner-shape: superellipse(2)) {
    --squircle-r: calc(0.375rem * (1 - pow(2, -0.5)) / (1 - pow(2, -0.25)));
    border-radius: var(--squircle-r); /* ≈ 0.690rem, compensated */
    corner-shape: superellipse(2);
  }
}
```

The browser does the actual `calc()` at render time using native [`pow()` and `calc()`](https://caniuse.com/?search=pow) — there's no build-time float math in the emitted CSS.

The adjusted radius is wrapped in a `@supports (corner-shape: superellipse(2))` rule, so browsers without support simply use the original `border-radius` unchanged. This means your corners will look visually consistent regardless of browser — no sudden changes when support lands, no broken fallbacks. Since browser support for `corner-shape` is still not universal, this gives you consistent visual border-radius forever.

See the [interactive demo](https://dogmar.github.io/squircle) for a visual explanation.

## Browser support & fallback strategy

### Support matrix

| Feature                                                                    | Used for                                       | Support                                                        |
| -------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| [`corner-shape: superellipse()`](https://caniuse.com/?search=corner-shape) | The squircle shape itself                      | New; fallback to plain `border-radius` in unsupported browsers |
| [`@supports`](https://caniuse.com/css-supports-api)                        | Gating the correction                          | Universal for years                                            |
| [`pow()` / `calc()`](https://caniuse.com/?search=pow)                      | The correction math                            | Widely supported (Safari 16.4+, Chrome 112+, Firefox 118+)     |
| [Logical properties](https://caniuse.com/css-logical-props)                | `squircle-s/e/ss/se/es/ee-*`                   | Widely supported                                               |
| [CSS `@function`](https://caniuse.com/?search=%40function)                 | Optional `squircle-radius()` helper            | Experimental; Chrome flag only                                 |
| [CSS custom properties](https://caniuse.com/css-variables)                 | Theme tokens, `--squircle-amt`, `--squircle-r` | Universal                                                      |

The Tailwind utilities depend on rows 1–4 and row 6. Only `corner-shape` itself is "new" — everything else is shipped broadly. The standalone `@function` helper is the only genuinely experimental piece.

### Fallback strategy

The corrected radius is wrapped in `@supports (corner-shape: superellipse(2))`, so browsers that don't know about `corner-shape` skip the entire block and fall back to the plain `border-radius` declaration above — no `corner-shape`, no squircle, just a regular rounded corner at your original theme radius. Ship `squircle-*` today without worrying about Safari: unsupported browsers show `rounded-*`-equivalent corners now, and the squircle shape lights up automatically when support lands, without any visual jump in the already-shipped radius.

## Why it called "squircle" when it use "superellipse()"?

Cuz ain't no one, not even a clanker want to type supperlips over and over again. See? I couldn't even type it _once_ without mussin' it up.

## Alternatives considered

- **Just use `corner-shape: superellipse()` directly.** Works fine, but at the same `border-radius` the corners read as smaller than `rounded-*` — so swapping one for the other breaks your visual hierarchy and you end up eyeballing compensation for every component. This package is that eyeballing, solved once.
- **JS squircle libraries** (e.g. Figma Squircle). SVG-based, not native CSS, they carry a runtime cost and don't compose with Tailwind's utility model.
- **Write the `@utility` block in your own project.** Totally reasonable — it's ~100 lines of CSS. See ["Should you install or copy/paste?"](#should-you-install-or-copypaste) for when that's the right call.
- **Wait for `corner-shape` to land everywhere and skip the correction.** I mean, sure. You'll just need to get used to how `border-radius` effects superellipseseses. Go for it. Though if you keep using the border-radiuses you know and love, it makes it easier to do the math on getting nested corners to snug up nicely.

## Should you install or copy/paste?

Both are first-class. The copy/paste block is right below, and it's honestly maybe ~100 lines of CSS.

**Copy/paste if:**

- Honestly, I recommend it. Let's be real, I'm probably not going to make many updates to this library, and why expose yourself to some future security risk when I die and Vladimir Jong Un trojan-horses this thing.
- You want zero runtime/build dependencies.
- You want to tweak the formula, the utility names, or the value validation yourself.
- You're not sure you'll want updates — the CSS is short and the math won't change.

**Install if:**

- You want upgrades when the formula tightens, the value validation changes, or the utility surface grows.
- You want the JS plugin form (custom `prefix`, `amt-var`, `r-var`).
- You use `tailwind-merge` and want the conflict config maintained for you.
- You want the standalone [`squircle-radius()`](#css-function-squircle-radius) CSS function for non-Tailwind use.

## FAQ

### Does this work in Safari/Firefox/Chrome today?

Partially, at time of writing — recent Chrome ships `corner-shape`, Safari and Firefox are still catching up. Check [caniuse](https://caniuse.com/?search=corner-shape) for the current state. Either way you're fine: in a browser without support, you get a plain `border-radius` at the pre-correction value, which visually matches `rounded-*`. No broken layouts, no visible fallback weirdness.

### Does it work with Tailwind v3?

The **CSS utilities** (`tw-utils.css`) are v4-only — they use `@utility` and `--value()`, which don't exist in v3.

The **JS plugin** uses only APIs that exist in both v3 and v4 (`plugin.withOptions`, `matchUtilities`, `type: "length" | "number"`, `theme()`), so it's likely to work in v3 via a `tailwind.config.js`-style registration — but it's not currently tested or declared against v3. Tracked in [#26](https://github.com/dogmar/squircle/pull/26).

### Why do my corners look smaller with `corner-shape: superellipse` without this?

At the same `border-radius`, a squircle pokes further into the corner, so less of the box edge is rounded off. The fix is to scale the radius up so the visual roundness matches `rounded-*` — see [How the radius correction works](#how-the-radius-correction-works).

### Does this add runtime JS?

No. Everything is static CSS — the Tailwind utilities expand at build time into declarations with a native `calc()` the browser evaluates. The JS plugin also runs at build time only. Zero JS ships to the browser.

### What happens once `corner-shape` is universal?

Nothing you need to do. The correction lives inside `@supports (corner-shape: superellipse(2))`, so it activates exactly when the shape does. Once the browser ships support, the shape applies _and_ the compensated radius applies, at the same moment. Your layout is identical before and after.

### Do I need `tailwind-merge`?

Only if your project already uses it. The extra config (`squircleMergeConfig`) exists so `rounded-lg squircle-md` de-duplicates the way you'd expect — otherwise tailwind-merge doesn't know `squircle-*` and `rounded-*` occupy the same slot.

### What's the difference between the utilities and the `squircle-radius()` function?

The utilities expand to inline `calc()` at build time — they work in any browser that supports `calc()` + `pow()` (most current ones) and degrade to plain `border-radius` where `corner-shape` isn't supported.

The `@function` form runs the same math at CSS runtime via CSS Values 5's `@function` — which is [experimental](https://caniuse.com/?search=%40function) (Chrome behind a flag, nothing else yet). Use the utilities unless you're specifically building for a non-Tailwind setup.

### Can I use a different `squircle-amt` for each corner?

No. `corner-shape` is declared once per element, so all four corners share the same K. You can still mix per-corner _radii_ (`squircle-tl-lg squircle-br-sm`), but the squircle-ness is uniform across the element.

### Why is the tone of this README all over the place?

Because I made Claude write most of it, got mad at claude, re-wrote a lot of stuff myself, then got tired and let Claude win.

### Did you just let Claude write this?

Kinda. Honestly I wrote the basic tailwind utilities by hand using a weird cobbled together formula I just kinda eyeballed to work for most values anyone would actually want to use for the `superellipse()` param. But then I thought, hey, robots are good at math, maybe they can make the formula _actually_ **correct**. And they could! The robots _could_ make a right formula. I was so happy. I cried tears of joy for days and days. So many tears I drowned my robot. And now I'll never code again. Alas.

## Copy/paste source

If you'd rather not add a dependency, copy the source directly. Click to expand each file.

<details>
<summary><strong><code>tw-utils.css</code></strong> — the Tailwind utilities</summary>

<!-- BEGIN:dist/tw-utils.css -->

```css
/* ── Squircle utilities ─────────────────────────────────────── */
/* squircle-amt-[n] sets the superellipse amount (default 2)    */
/* squircle-* mirrors rounded-* variants: all, t, r, b, l, s, e, tl, tr, br, bl, ss, se, es, ee */

@utility squircle-amt-* {
  --squircle-amt: --value(--squircle-amt-*, number, [number]);
  @supports (corner-shape: superellipse(2)) {
    corner-shape: superellipse(var(--squircle-amt));
  }
}

@utility squircle-* {
  border-radius: --value(--radius-*, [length]);
  @supports (corner-shape: superellipse(2)) {
    --squircle-r: calc(--value(--radius-*, [length]) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 2)))));
    border-radius: var(--squircle-r);
    corner-shape: superellipse(var(--squircle-amt, 2));
  }
}

/* --- Per-side physical variants --- */

@utility squircle-t-* {
  border-top-left-radius: --value(--radius-*, [length]);
  border-top-right-radius: --value(--radius-*, [length]);
  @supports (corner-shape: superellipse(2)) {
    --squircle-r: calc(--value(--radius-*, [length]) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 2)))));
    border-top-left-radius: var(--squircle-r);
    border-top-right-radius: var(--squircle-r);
    corner-shape: superellipse(var(--squircle-amt, 2));
  }
}

@utility squircle-r-* {
  border-top-right-radius: --value(--radius-*, [length]);
  border-bottom-right-radius: --value(--radius-*, [length]);
  @supports (corner-shape: superellipse(2)) {
    --squircle-r: calc(--value(--radius-*, [length]) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 2)))));
    border-top-right-radius: var(--squircle-r);
    border-bottom-right-radius: var(--squircle-r);
    corner-shape: superellipse(var(--squircle-amt, 2));
  }
}

@utility squircle-b-* {
  border-bottom-left-radius: --value(--radius-*, [length]);
  border-bottom-right-radius: --value(--radius-*, [length]);
  @supports (corner-shape: superellipse(2)) {
    --squircle-r: calc(--value(--radius-*, [length]) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 2)))));
    border-bottom-left-radius: var(--squircle-r);
    border-bottom-right-radius: var(--squircle-r);
    corner-shape: superellipse(var(--squircle-amt, 2));
  }
}

@utility squircle-l-* {
  border-top-left-radius: --value(--radius-*, [length]);
  border-bottom-left-radius: --value(--radius-*, [length]);
  @supports (corner-shape: superellipse(2)) {
    --squircle-r: calc(--value(--radius-*, [length]) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 2)))));
    border-top-left-radius: var(--squircle-r);
    border-bottom-left-radius: var(--squircle-r);
    corner-shape: superellipse(var(--squircle-amt, 2));
  }
}

/* --- Per-side logical variants --- */

@utility squircle-s-* {
  border-start-start-radius: --value(--radius-*, [length]);
  border-end-start-radius: --value(--radius-*, [length]);
  @supports (corner-shape: superellipse(2)) {
    --squircle-r: calc(--value(--radius-*, [length]) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 2)))));
    border-start-start-radius: var(--squircle-r);
    border-end-start-radius: var(--squircle-r);
    corner-shape: superellipse(var(--squircle-amt, 2));
  }
}

@utility squircle-e-* {
  border-start-end-radius: --value(--radius-*, [length]);
  border-end-end-radius: --value(--radius-*, [length]);
  @supports (corner-shape: superellipse(2)) {
    --squircle-r: calc(--value(--radius-*, [length]) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 2)))));
    border-start-end-radius: var(--squircle-r);
    border-end-end-radius: var(--squircle-r);
    corner-shape: superellipse(var(--squircle-amt, 2));
  }
}

/* --- Per-corner physical variants --- */

@utility squircle-tl-* {
  border-top-left-radius: --value(--radius-*, [length]);
  @supports (corner-shape: superellipse(2)) {
    border-top-left-radius: calc(--value(--radius-*, [length]) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 2)))));
    corner-shape: superellipse(var(--squircle-amt, 2));
  }
}

@utility squircle-tr-* {
  border-top-right-radius: --value(--radius-*, [length]);
  @supports (corner-shape: superellipse(2)) {
    border-top-right-radius: calc(--value(--radius-*, [length]) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 2)))));
    corner-shape: superellipse(var(--squircle-amt, 2));
  }
}

@utility squircle-br-* {
  border-bottom-right-radius: --value(--radius-*, [length]);
  @supports (corner-shape: superellipse(2)) {
    border-bottom-right-radius: calc(--value(--radius-*, [length]) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 2)))));
    corner-shape: superellipse(var(--squircle-amt, 2));
  }
}

@utility squircle-bl-* {
  border-bottom-left-radius: --value(--radius-*, [length]);
  @supports (corner-shape: superellipse(2)) {
    border-bottom-left-radius: calc(--value(--radius-*, [length]) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 2)))));
    corner-shape: superellipse(var(--squircle-amt, 2));
  }
}

/* --- Per-corner logical variants --- */

@utility squircle-ss-* {
  border-start-start-radius: --value(--radius-*, [length]);
  @supports (corner-shape: superellipse(2)) {
    border-start-start-radius: calc(--value(--radius-*, [length]) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 2)))));
    corner-shape: superellipse(var(--squircle-amt, 2));
  }
}

@utility squircle-se-* {
  border-start-end-radius: --value(--radius-*, [length]);
  @supports (corner-shape: superellipse(2)) {
    border-start-end-radius: calc(--value(--radius-*, [length]) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 2)))));
    corner-shape: superellipse(var(--squircle-amt, 2));
  }
}

@utility squircle-es-* {
  border-end-start-radius: --value(--radius-*, [length]);
  @supports (corner-shape: superellipse(2)) {
    border-end-start-radius: calc(--value(--radius-*, [length]) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 2)))));
    corner-shape: superellipse(var(--squircle-amt, 2));
  }
}

@utility squircle-ee-* {
  border-end-end-radius: --value(--radius-*, [length]);
  @supports (corner-shape: superellipse(2)) {
    border-end-end-radius: calc(--value(--radius-*, [length]) * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 2)))));
    corner-shape: superellipse(var(--squircle-amt, 2));
  }
}
```

<!-- END:dist/tw-utils.css -->

</details>

<details>
<summary><strong><code>tw-plugin.mjs</code></strong> — the JS plugin</summary>

<!-- BEGIN:dist/tw-plugin.mjs -->

````js
import plugin from "tailwindcss/plugin";
const DEFAULT_AMOUNT_VAR_NAME = "--squircle-amt";
const DEFAULT_AMT_CSS = `var(${DEFAULT_AMOUNT_VAR_NAME}, 2)`;
const getCornerShape = (varName = DEFAULT_AMOUNT_VAR_NAME) => `superellipse(var(${varName}, 2))`;
function correctedRadius(radius, amt = DEFAULT_AMT_CSS) {
	return `calc(${radius} * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * ${amt}))))`;
}
function isComment(entry) {
	return !Array.isArray(entry);
}
const SUPPORTS_RULE = "@supports (corner-shape: superellipse(2))";
const VARIANTS = {
	"": ["border-radius"],
	"$comment-physical-sides": { comment: "/* --- Per-side physical variants --- */" },
	t: ["border-top-left-radius", "border-top-right-radius"],
	r: ["border-top-right-radius", "border-bottom-right-radius"],
	b: ["border-bottom-left-radius", "border-bottom-right-radius"],
	l: ["border-top-left-radius", "border-bottom-left-radius"],
	"$comment-logical-sides": { comment: "/* --- Per-side logical variants --- */" },
	s: ["border-start-start-radius", "border-end-start-radius"],
	e: ["border-start-end-radius", "border-end-end-radius"],
	"$comment-physical-corners": { comment: "/* --- Per-corner physical variants --- */" },
	tl: ["border-top-left-radius"],
	tr: ["border-top-right-radius"],
	br: ["border-bottom-right-radius"],
	bl: ["border-bottom-left-radius"],
	"$comment-logical-corners": { comment: "/* --- Per-corner logical variants --- */" },
	ss: ["border-start-start-radius"],
	se: ["border-start-end-radius"],
	es: ["border-end-start-radius"],
	ee: ["border-end-end-radius"]
};
function variantEntries() {
	return Object.entries(VARIANTS).filter((entry) => !isComment(entry[1]));
}
function usesIntermediateVar(suffix) {
	const entry = VARIANTS[suffix];
	if (!entry || isComment(entry)) return false;
	return suffix === "" || entry.length > 1;
}
//#endregion
//#region src/tw-plugin.ts
const squircle = plugin.withOptions((options = {}) => ({ matchUtilities, theme }) => {
	const amtVar = options.amtVar ?? options["amt-var"] ?? "--squircle-amt";
	const rVar = options.rVar ?? options["r-var"] ?? "--squircle-r";
	const prefix = options.prefix ?? "squircle";
	const radiusValues = theme("borderRadius");
	const amtCss = `var(${amtVar}, 2)`;
	const rCss = `var(${rVar})`;
	const cornerShape = getCornerShape(amtVar);
	matchUtilities({ [`${prefix}-amt`]: (value) => ({
		[amtVar]: value,
		[SUPPORTS_RULE]: { "corner-shape": `superellipse(var(${amtVar}))` }
	}) }, { type: "number" });
	for (const [suffix, props] of variantEntries()) {
		const name = suffix ? `${prefix}-${suffix}` : prefix;
		if (usesIntermediateVar(suffix)) matchUtilities({ [name]: (value) => ({
			...Object.fromEntries(props.map((p) => [p, value])),
			[SUPPORTS_RULE]: {
				[rVar]: correctedRadius(value, amtCss),
				...Object.fromEntries(props.map((p) => [p, rCss])),
				"corner-shape": cornerShape
			}
		}) }, {
			type: "length",
			values: radiusValues
		});
		else {
			const prop = props[0];
			matchUtilities({ [name]: (value) => {
				const result = { [prop]: value };
				result[SUPPORTS_RULE] = {
					[prop]: correctedRadius(value, amtCss),
					"corner-shape": cornerShape
				};
				return result;
			} }, {
				type: "length",
				values: radiusValues
			});
		}
	}
});
//#endregion
export { squircle as default };

//# sourceMappingURL=tw-plugin.mjs.map```
<!-- END:dist/tw-plugin.mjs -->

</details>

<details>
<summary><strong><code>tw-merge-cfg.mjs</code></strong> — the tailwind-merge config</summary>

<!-- BEGIN:dist/tw-merge-cfg.mjs -->
```js
//#region src/tw-merge-cfg.ts
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
	"rounded-bl"
];
const squircleMergeConfig = { extend: {
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
			{ "squircle-ee": [() => true] }
		],
		"squircle-amt": [{ "squircle-amt": [() => true] }]
	},
	conflictingClassGroups: {
		squircle: [...allRoundedGroups, "squircle-amt"],
		...Object.fromEntries(allRoundedGroups.map((g) => [g, ["squircle", "squircle-amt"]]))
	}
} };
//#endregion
export { squircleMergeConfig };

//# sourceMappingURL=tw-merge-cfg.mjs.map```
<!-- END:dist/tw-merge-cfg.mjs -->

</details>

## Prior art & credits

- **CSS Backgrounds 4** — the [`corner-shape` spec](https://drafts.csswg.org/css-backgrounds-4/#corner-shape-value) defines the `superellipse()` family of corner curves and their maths.
- **MDN** — the [`superellipse()` reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/superellipse) has the clearest plain-language walkthrough of what K values produce.
- **Tailwind CSS v4** — the `@utility` / `--value()` API this package is built on.

## License

MIT
````
