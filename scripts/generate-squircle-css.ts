import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_AMT, VARIANTS, isComment, usesIntermediateVar } from "../src/variants";

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, "..", "src");

function extractFormula(): string {
  const css = readFileSync(join(srcDir, "squircle-radius.css"), "utf-8");
  const match = /result:\s*(calc\([\s\S]*?\));/m.exec(css);
  if (!match) {
    throw new Error("Could not extract formula from squircle-radius.css");
  }
  const raw = match[1] ?? "";
  if (!raw.includes("pow(2, -0.5)") || !raw.includes("var(--squircle-amt)")) {
    throw new Error("Extracted formula is missing expected substrings");
  }
  return raw;
}

function buildUtilityFormula(formula: string): string {
  return formula
    .replace("var(--radius)", "--value(--radius- *)")
    .replace("var(--squircle-amt)", `var(--squircle-amt, ${DEFAULT_AMT})`);
}

function generateCss(): string {
  const formula = buildUtilityFormula(extractFormula());
  const cornerShape = `superellipse(var(--squircle-amt, ${DEFAULT_AMT}))`;
  const lines: string[] = [];

  lines.push(
    "/* THIS FILE IS GENERATED — do not edit by hand.",
    " * Source: scripts/generate-squircle-css.ts",
    " * Formula: src/squircle-radius.css",
    " * Run: pnpm vp run generate:css */",
    "",
    "/* ── Squircle utilities ─────────────────────────────────────── */",
    `/* squircle-amt-[n] sets the superellipse amount (default ${DEFAULT_AMT})    */`,
    "/* squircle-* mirrors rounded-* variants: all, t, r, b, l, s, e, tl, tr, br, bl, ss, se, es, ee */",
    "",
  );

  // squircle-amt-* (static, structurally different)
  lines.push(
    "@utility squircle-amt-* {",
    "  --squircle-amt: --value(--squircle-amt-*, number);",
    "  @supports (corner-shape: superellipse()) {",
    "    corner-shape: superellipse(var(--squircle-amt));",
    "  }",
    "}",
    "",
  );

  for (const [suffix, entry] of Object.entries(VARIANTS)) {
    if (isComment(entry)) {
      lines.push(entry.comment, "");
      continue;
    }

    const props = entry;
    const name = suffix ? `squircle-${suffix}-*` : "squircle-*";

    if (usesIntermediateVar(suffix)) {
      lines.push(`@utility ${name} {`);
      for (const prop of props) {
        lines.push(`  ${prop}: --value(--radius-*);`);
      }
      lines.push("  @supports (corner-shape: superellipse()) {");
      lines.push(`    --squircle-r: ${formula};`);
      for (const prop of props) {
        lines.push(`    ${prop}: var(--squircle-r);`);
      }
      lines.push(`    corner-shape: ${cornerShape};`);
      lines.push("  }");
      lines.push("}");
    } else {
      const prop = props[0];
      lines.push(`@utility ${name} {`);
      lines.push(`  ${prop}: --value(--radius-*);`);
      lines.push("  @supports (corner-shape: superellipse()) {");
      lines.push(`    ${prop}: ${formula};`);
      lines.push(`    corner-shape: ${cornerShape};`);
      lines.push("  }");
      lines.push("}");
    }
    lines.push("");
  }

  return lines.join("\n");
}

const output = generateCss();
const distDir = join(__dirname, "..", "dist");
mkdirSync(distDir, { recursive: true });
const outPath = join(distDir, "squircle.css");
writeFileSync(outPath, output);
console.log(`Generated ${outPath}`);
