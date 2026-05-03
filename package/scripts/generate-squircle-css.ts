import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_AMT,
  SUPPORTS_RULE,
  VARIANTS,
  correctedRadius,
  getCornerShape,
  isComment,
  squircleCssObj,
  usesIntermediateVar,
} from "../src/variants";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Support arbitrary, bare, and theme values in one --value() call.
// https://tailwindcss.com/docs/adding-custom-styles#functional-utilities
const value = "--value(--radius-*, [length])";

function renderUtility(name: string, props: string[]): string {
  const obj = squircleCssObj(props, value);
  const lines: string[] = [`@utility ${name} {`];

  for (const [key, val] of Object.entries(obj)) {
    if (key === SUPPORTS_RULE && typeof val === "object" && val !== null) {
      lines.push(`  ${SUPPORTS_RULE} {`);
      for (const [innerKey, innerVal] of Object.entries(val)) {
        lines.push(`    ${innerKey}: ${innerVal as string};`);
      }
      lines.push(`  }`);
    } else {
      lines.push(`  ${key}: ${val as string};`);
    }
  }
  lines.push(`}`);
  return lines.join("\n");
}

function generateCss(): string {
  const blocks: string[] = [];

  blocks.push(`\
/* ── Squircle utilities ─────────────────────────────────────── */
/* squircle-amt-[n] sets the superellipse amount (default ${DEFAULT_AMT})    */
/* squircle-* mirrors rounded-* variants: all, t, r, b, l, s, e, tl, tr, br, bl, ss, se, es, ee */

@utility squircle-amt-* {
  --squircle-amt: --value(--squircle-amt-*, number, [number]);
  ${SUPPORTS_RULE} {
    corner-shape: superellipse(var(--squircle-amt));
  }
}`);

  for (const [suffix, entry] of Object.entries(VARIANTS)) {
    if (isComment(entry)) {
      blocks.push(entry.comment);
      continue;
    }

    const name = suffix ? `squircle-${suffix}-*` : "squircle-*";
    blocks.push(renderUtility(name, entry));
  }

  return blocks.join("\n\n") + "\n";
}

/**
 * Generates a vanilla CSS file with one rule per variant, sized to common
 * Tailwind radii (sm/md/lg/xl/2xl/3xl/full). Unlike `tw-utils.css`, this file
 * uses no Tailwind directives, so it can be `@import`-ed into any project —
 * StyleX, vanilla CSS, CSS Modules, plain HTML — that needs the squircle
 * utilities without buying into Tailwind's `@utility` API.
 *
 * Class shape: `.squircle-md`, `.squircle-tl-lg`, `.squircle-amt-3`, etc.
 */
function generateVanillaCss(): string {
  // Default Tailwind v4 radii — keeps this file self-contained without forcing
  // a token system on consumers. Any project using non-Tailwind radii can
  // either define their own --radius-* vars and override, or copy/paste from
  // the source CSS and adjust.
  const RADII: Record<string, string> = {
    xs: "0.125rem",
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    "4xl": "2rem",
    full: "9999px",
  };
  const AMT_VALUES = [1, 2, 3, 4, 5];

  const blocks: string[] = [];
  blocks.push(`\
/* ── Squircle vanilla utilities ───────────────────────────────
 * Plain CSS classes — no Tailwind, no preprocessor required.
 * Use directly via className= alongside StyleX, CSS Modules,
 * vanilla CSS, or any other styling system.
 *
 *   <div class="squircle-md">…</div>
 *   <div class="squircle-tl-lg squircle-amt-3">…</div>
 *
 * Override --squircle-amt at any scope to change the superellipse
 * exponent globally. Per-corner amt-* utilities also bind it
 * locally for one element.
 * ───────────────────────────────────────────────────────────── */`);

  // amt-* utilities first, mirroring the Tailwind structure.
  for (const amt of AMT_VALUES) {
    blocks.push(`\
.squircle-amt-${amt} {
  --squircle-amt: ${amt};
  ${SUPPORTS_RULE} {
    corner-shape: superellipse(var(--squircle-amt));
  }
}`);
  }

  for (const [suffix, entry] of Object.entries(VARIANTS)) {
    if (isComment(entry)) {
      blocks.push(entry.comment);
      continue;
    }
    for (const [size, radius] of Object.entries(RADII)) {
      const className = suffix ? `.squircle-${suffix}-${size}` : `.squircle-${size}`;
      const useIv = usesIntermediateVar(suffix);
      const lines: string[] = [`${className} {`];
      for (const prop of entry) lines.push(`  ${prop}: ${radius};`);
      lines.push(`  ${SUPPORTS_RULE} {`);
      if (useIv) {
        lines.push(`    --squircle-r: ${correctedRadius(radius)};`);
        for (const prop of entry) lines.push(`    ${prop}: var(--squircle-r);`);
      } else {
        for (const prop of entry) lines.push(`    ${prop}: ${correctedRadius(radius)};`);
      }
      lines.push(`    corner-shape: ${getCornerShape()};`);
      lines.push(`  }`);
      lines.push(`}`);
      blocks.push(lines.join("\n"));
    }
  }

  return blocks.join("\n\n") + "\n";
}

const output = generateCss();
const distDir = join(__dirname, "..", "dist");
mkdirSync(distDir, { recursive: true });
const outPath = join(distDir, "tw-utils.css");
writeFileSync(outPath, output);
console.log(`Generated ${outPath} (skipping fmt)`);

const vanillaPath = join(distDir, "squircle.css");
writeFileSync(vanillaPath, generateVanillaCss());
console.log(`Generated ${vanillaPath} (skipping fmt)`);

const radiusSrc = join(__dirname, "..", "src", "squircle-radius.css");
const radiusDest = join(distDir, "squircle-radius.css");
copyFileSync(radiusSrc, radiusDest);
console.log(`Copied ${radiusDest}`);
