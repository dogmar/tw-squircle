import { describe, expect, it } from "vitest";
import {
  SQUIRCLE_AMOUNT_VAR,
  SQUIRCLE_SUPPORTS_QUERY,
  defineSquircleVariants,
  squircle,
  squircleBottomLeft,
  squircleEndEnd,
  squircleTop,
  squircleTopLeft,
} from "./squircle.stylex";

describe("squircle.stylex helpers", () => {
  it("exports the canonical custom-property name and supports query", () => {
    expect(SQUIRCLE_AMOUNT_VAR).toBe("--squircle-amt");
    expect(SQUIRCLE_SUPPORTS_QUERY).toBe("@supports (corner-shape: superellipse(2))");
  });

  it("squircle(radius) emits per-property conditional values for borderRadius + cornerShape", () => {
    expect(squircle("1rem")).toMatchInlineSnapshot(`
      {
        "borderRadius": {
          "@supports (corner-shape: superellipse(2))": "calc(1rem * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 2)))))",
          "default": "1rem",
        },
        "cornerShape": {
          "@supports (corner-shape: superellipse(2))": "superellipse(var(--squircle-amt, 2))",
          "default": null,
        },
      }
    `);
  });

  it("squircleTop(radius) covers both top corners", () => {
    const out = squircleTop("0.5rem");
    expect(Object.keys(out).sort()).toEqual([
      "borderTopLeftRadius",
      "borderTopRightRadius",
      "cornerShape",
    ]);
    const tl = out["borderTopLeftRadius"] as { default: string };
    expect(tl["default"]).toBe("0.5rem");
  });

  it("single-corner helpers (squircleTopLeft, squircleBottomLeft, squircleEndEnd) target one property", () => {
    expect(Object.keys(squircleTopLeft("8px")).sort()).toEqual([
      "borderTopLeftRadius",
      "cornerShape",
    ]);
    expect(Object.keys(squircleBottomLeft("8px")).sort()).toEqual([
      "borderBottomLeftRadius",
      "cornerShape",
    ]);
    expect(Object.keys(squircleEndEnd("8px")).sort()).toEqual([
      "borderEndEndRadius",
      "cornerShape",
    ]);
  });

  it("custom amt as a number bakes the exponent into the calc", () => {
    const out = squircle("1rem", 3);
    const radius = out["borderRadius"] as { [k: string]: string | null };
    expect(radius[SQUIRCLE_SUPPORTS_QUERY]).toContain("pow(2, -1 * 3)");
  });

  it("custom amt as a var() string is reflected in the cornerShape value", () => {
    const out = squircle("1rem", "var(--my-amt, 2)");
    const cs = out["cornerShape"] as { [k: string]: string | null };
    expect(cs[SQUIRCLE_SUPPORTS_QUERY]).toBe("superellipse(var(--my-amt, 2))");
  });
});

describe("defineSquircleVariants factory", () => {
  it("produces one entry per input vars key, default side = all corners", () => {
    const fakeVars = {
      sm: "var(--radii-sm)",
      md: "var(--radii-md)",
      lg: "var(--radii-lg)",
    };
    const out = defineSquircleVariants(fakeVars);
    expect(Object.keys(out).sort()).toEqual(["lg", "md", "sm"]);
    for (const key of Object.keys(fakeVars)) {
      expect(Object.keys(out[key as keyof typeof out]).sort()).toEqual([
        "borderRadius",
        "cornerShape",
      ]);
    }
  });

  it("threads each vars value through as the radius literal", () => {
    const out = defineSquircleVariants({ md: "var(--radii-md)" });
    const radius = out["md"]!["borderRadius"] as { default: string; [k: string]: string };
    expect(radius["default"]).toBe("var(--radii-md)");
    expect(radius[SQUIRCLE_SUPPORTS_QUERY]).toContain("calc(var(--radii-md)");
  });

  it("side option switches the targeted CSS properties", () => {
    const out = defineSquircleVariants(
      { md: "var(--radii-md)" },
      { side: "topLeft" },
    );
    expect(Object.keys(out["md"]!).sort()).toEqual(["borderTopLeftRadius", "cornerShape"]);
  });

  it("amt option flows through to the corrected formula", () => {
    const out = defineSquircleVariants(
      { md: "var(--radii-md)" },
      { amt: "var(--my-amt, 2)" },
    );
    const cs = out["md"]!["cornerShape"] as { [k: string]: string | null };
    expect(cs[SQUIRCLE_SUPPORTS_QUERY]).toBe("superellipse(var(--my-amt, 2))");
  });

  it("returns a plain object literal (no Map/Set/Proxy) so StyleX's static analyzer can walk it", () => {
    const out = defineSquircleVariants({ a: "1rem", b: "2rem" });
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
    for (const v of Object.values(out)) {
      expect(Object.getPrototypeOf(v)).toBe(Object.prototype);
    }
  });
});
