import { transformSync } from "@babel/core";
import stylexPlugin from "@stylexjs/babel-plugin";
import { describe, expect, it } from "vitest";

/**
 * Real StyleX-compiler integration tests, using `@stylexjs/babel-plugin` to
 * compile fixture sources and inspect the emitted CSS. These tests pin down
 * what consumers can and can't write — and prove the documented patterns
 * actually compile.
 */

interface Meta {
  stylex?: Array<[string, { ltr: string; rtl?: string | null }, number]>;
}

function compile(source: string, name: string): {
  ok: boolean;
  error: string;
  rules: NonNullable<Meta["stylex"]>;
  code: string;
} {
  try {
    const result = transformSync(source, {
      filename: `${import.meta.dirname}/__stylex-fixture__/${name}.stylex.ts`,
      babelrc: false,
      configFile: false,
      presets: [["@babel/preset-typescript", { allowDeclareFields: true }]],
      plugins: [
        [
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
          (stylexPlugin as any).default ?? stylexPlugin,
          {
            dev: false,
            unstable_moduleResolution: { type: "commonJS", rootDir: import.meta.dirname },
          },
        ],
      ],
    });
    if (!result) return { ok: false, error: "null result", rules: [], code: "" };
    const meta = (result.metadata ?? {}) as Meta;
    return {
      ok: true,
      error: "",
      rules: meta.stylex ?? [],
      code: result.code ?? "",
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      rules: [],
      code: "",
    };
  }
}

function rulesAsCss(rules: NonNullable<Meta["stylex"]>): string {
  return rules.map((r) => r[1].ltr).join("\n");
}

describe("StyleX-native pattern (documented in README)", () => {
  it("a hand-written stylex.create literal with the squircle @supports values compiles and emits the gated rules", () => {
    // The README's recommended pattern for StyleX consumers who want to keep
    // their styles inside stylex.create: write the @supports conditional
    // values as string literals, with the calc(...) precomputed (or generated
    // by a build-time codegen using `correctedRadiusCalc`).
    const source = `
      import * as stylex from '@stylexjs/stylex';

      export const styles = stylex.create({
        card: {
          borderRadius: {
            default: '0.375rem',
            '@supports (corner-shape: superellipse(2))':
              'calc(0.375rem * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 2)))))',
          },
          cornerShape: {
            default: null,
            '@supports (corner-shape: superellipse(2))': 'superellipse(var(--squircle-amt, 2))',
          },
        },
      });
    `;
    const out = compile(source, "documented-pattern");
    expect(out.ok).toBe(true);
    const css = rulesAsCss(out.rules);
    expect(css).toContain("@supports (corner-shape: superellipse(2))");
    expect(css).toContain("border-radius:0.375rem");
    expect(css).toContain("calc(0.375rem * (1 - pow(2, -0.5))");
    expect(css).toContain("corner-shape:superellipse(var(--squircle-amt,2))");
  });
});

describe("StyleX static-analysis boundary (documented in module docstring)", () => {
  // These tests pin the constraints that motivated the static-CSS sidecar
  // (`@klinking/squircle/squircle.css`) instead of stylex.create-friendly
  // helpers. If a future StyleX release relaxes these, we can revisit.

  it("rejects function calls as the stylex.create argument", () => {
    const out = compile(
      `import * as stylex from '@stylexjs/stylex';
       function build() { return { a: { borderRadius: '1rem' } }; }
       export const s = stylex.create(build());`,
      "boundary-fn-arg",
    );
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/can only accept an object/);
  });

  it("rejects spreading an imported function call inside a property value", () => {
    const out = compile(
      `import * as stylex from '@stylexjs/stylex';
       import { squircle } from '../squircle.stylex';
       export const s = stylex.create({ a: { ...squircle('1rem') } });`,
      "boundary-spread-imported",
    );
    expect(out.ok).toBe(false);
  });

  it("rejects an imported string identifier as a computed @-rule key", () => {
    const out = compile(
      `import * as stylex from '@stylexjs/stylex';
       import { SQUIRCLE_SUPPORTS_QUERY } from '../squircle.stylex';
       export const s = stylex.create({
         a: { borderRadius: { default: '1rem', [SQUIRCLE_SUPPORTS_QUERY]: 'calc(1rem * 2)' } }
       });`,
      "boundary-computed-key",
    );
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/Invalid pseudo or at-rule/);
  });
});
