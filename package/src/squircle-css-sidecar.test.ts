import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Verifies the vanilla CSS sidecar (`dist/squircle.css`) shipped for StyleX
 * and other non-Tailwind consumers. The file must:
 *   - Exist after `vp run build`.
 *   - Carry plain `.squircle-*` class selectors (no `@utility` directive).
 *   - Wrap the corrected radius in `@supports (corner-shape: superellipse(2))`.
 *   - Include both physical and logical variants for every theme size.
 */

const distPath = join(import.meta.dirname, "..", "dist", "squircle.css");

describe("squircle.css sidecar", () => {
  it("is generated into dist by the build", () => {
    expect(existsSync(distPath)).toBe(true);
  });

  describe("file contents", () => {
    if (!existsSync(distPath)) return;
    const css = readFileSync(distPath, "utf-8");

    it("emits plain class selectors, not @utility blocks", () => {
      expect(css).not.toContain("@utility");
      expect(css).toMatch(/\.squircle-md\s*{/);
    });

    it("includes the all-corners utility for every standard radius", () => {
      for (const size of ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "full"]) {
        expect(css).toMatch(new RegExp(`\\.squircle-${size}\\s*{`));
      }
    });

    it("includes per-side utilities for top/right/bottom/left at md", () => {
      for (const side of ["t", "r", "b", "l"]) {
        expect(css).toMatch(new RegExp(`\\.squircle-${side}-md\\s*{`));
      }
    });

    it("includes per-corner physical and logical utilities at md", () => {
      for (const corner of ["tl", "tr", "br", "bl", "ss", "se", "es", "ee"]) {
        expect(css).toMatch(new RegExp(`\\.squircle-${corner}-md\\s*{`));
      }
    });

    it("gates the corrected radius behind @supports", () => {
      expect(css).toContain("@supports (corner-shape: superellipse(2))");
      expect(css).toContain("pow(2, -0.5)");
      expect(css).toContain("var(--squircle-amt, 2)");
    });

    it("includes amt-* utilities for common exponents", () => {
      for (const amt of [1, 2, 3, 4, 5]) {
        expect(css).toMatch(new RegExp(`\\.squircle-amt-${amt}\\s*{`));
      }
    });

    it("uses --squircle-r for the all-corners and per-side variants (matches Tailwind behavior)", () => {
      // Spot-check the all-corners and one per-side variant
      const md = /\.squircle-md\s*{[^}]*?@supports[^}]*?--squircle-r:[^;]+;/s;
      expect(css).toMatch(md);
      const tMd = /\.squircle-t-md\s*{[^}]*?@supports[^}]*?--squircle-r:[^;]+;/s;
      expect(css).toMatch(tMd);
    });

    it("inlines the calc directly for single-corner variants (no --squircle-r)", () => {
      // For .squircle-tl-md the corrected calc should be on the property,
      // not via --squircle-r.
      const tlMd = css.match(/\.squircle-tl-md\s*{[^]*?\n}/);
      expect(tlMd).toBeTruthy();
      expect(tlMd![0]).not.toContain("--squircle-r");
      expect(tlMd![0]).toContain("border-top-left-radius: calc(");
    });
  });
});
