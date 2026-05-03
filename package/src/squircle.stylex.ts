import {
  CAMEL_VARIANTS,
  DEFAULT_AMOUNT_VAR_NAME,
  DEFAULT_AMT,
  SUPPORTS_RULE,
  correctedRadius,
  getCornerShape,
  variantEntries,
  type CamelVariant,
} from "./variants";

/**
 * StyleX-flavored helpers for the squircle utilities.
 *
 * **Important — please read before using:** StyleX's babel/swc plugin requires
 * `stylex.create(...)` to receive a fully-static object literal. It rejects
 * function calls (including spreads of function calls) and computed property
 * keys derived from imported identifiers. That means **the helpers in this
 * module CANNOT be called inside `stylex.create({...})`** — doing so produces
 * `create() can only accept an object` or `Invalid pseudo or at-rule` errors
 * from the StyleX compiler.
 *
 * If you want squircle utilities in a StyleX project, the recommended path is
 * to import the static CSS sidecar:
 *
 * ```ts
 * import '@klinking/squircle/squircle.css';
 * // <div className="squircle-md" /> alongside any stylex.props(...) styles
 * ```
 *
 * What this module IS for:
 *
 *   1. Generating a literal `stylex.create({...})` block at *build time* via a
 *      codegen script (the helpers return plain object literals you can
 *      stringify into source).
 *   2. Use in CSS-in-JS systems that *do* support function calls in style
 *      values — emotion, styled-components, vanilla-extract recipes, JSS,
 *      inline `style={...}` props, etc.
 *   3. Reference values (`SQUIRCLE_AMOUNT_VAR`, `SQUIRCLE_SUPPORTS_QUERY`,
 *      `correctedRadiusCalc`) for users hand-writing their own
 *      `stylex.create({...})` literal — copy the formula into a string.
 *
 * The verified StyleX-native pattern, for reference:
 *
 * ```ts
 * import * as stylex from '@stylexjs/stylex';
 * export const radii = stylex.defineVars({ md: '0.375rem' });
 * export const styles = stylex.create({
 *   card: {
 *     borderRadius: {
 *       default: radii.md,
 *       '@supports (corner-shape: superellipse(2))':
 *         'calc(0.375rem * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 2)))))',
 *     },
 *     cornerShape: {
 *       default: null,
 *       '@supports (corner-shape: superellipse(2))': 'superellipse(var(--squircle-amt, 2))',
 *     },
 *   },
 * });
 * ```
 *
 * Note that the `borderRadius` `@supports` value must be a string literal —
 * the consumer can't reference `radii.md` inside `calc(...)` because StyleX
 * resolves `defineVars` keys to opaque identifiers, not to their source
 * literal. In practice, generate this block with a build-time script using
 * the helpers below.
 */

const DEFAULT_AMT_CSS = `var(${DEFAULT_AMOUNT_VAR_NAME}, ${DEFAULT_AMT})`;

/** CSS custom property name read by every helper for the superellipse exponent. */
export const SQUIRCLE_AMOUNT_VAR = DEFAULT_AMOUNT_VAR_NAME;

/** The `@supports` query string used to gate every corrected radius. */
export const SQUIRCLE_SUPPORTS_QUERY = SUPPORTS_RULE;

/**
 * Returns the `calc(...)` expression that produces the visually-corrected
 * radius for `corner-shape: superellipse(amt)`. Pure string in / string out —
 * safe to call from build scripts, codegen tools, or any context outside
 * `stylex.create(...)`.
 */
export function correctedRadiusCalc(
  radius: string,
  amt: string | number = DEFAULT_AMT_CSS,
): string {
  return correctedRadius(radius, typeof amt === "number" ? String(amt) : amt);
}

/** Returns the `superellipse(var(--squircle-amt, 2))` expression. */
export function squircleCornerShape(amtVar: string = DEFAULT_AMOUNT_VAR_NAME): string {
  return getCornerShape(amtVar);
}

const KEBAB_TO_CAMEL = new Map<string, string>();
function toCamel(kebab: string): string {
  const cached = KEBAB_TO_CAMEL.get(kebab);
  if (cached) return cached;
  const camel = kebab.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  KEBAB_TO_CAMEL.set(kebab, camel);
  return camel;
}

/**
 * StyleX-shaped style object: each property is either a literal value or a
 * `{ default, '@supports …': … }` conditional-value object.
 */
export type SquircleStyleObject = Record<
  string,
  string | number | null | { default: string | number | null; [supports: string]: string | number | null }
>;

function buildStyle(
  cssProps: string[],
  radius: string,
  amt: string | number,
): SquircleStyleObject {
  const corrected = correctedRadiusCalc(radius, amt);
  const cornerShapeVar =
    typeof amt === "string" && amt.startsWith("var(")
      ? amt.match(/var\((--[a-zA-Z0-9_-]+)/)?.[1]
      : null;

  const out: SquircleStyleObject = {};
  for (const prop of cssProps) {
    out[toCamel(prop)] = {
      default: radius,
      [SUPPORTS_RULE]: corrected,
    };
  }
  out["cornerShape"] = {
    default: null,
    [SUPPORTS_RULE]: squircleCornerShape(cornerShapeVar ?? DEFAULT_AMOUNT_VAR_NAME),
  };
  return out;
}

const variantBySuffix = new Map(variantEntries());

function helperFor(variant: CamelVariant): (radius: string, amt?: string | number) => SquircleStyleObject {
  const props = variantBySuffix.get(variant.suffix);
  if (!props) {
    throw new Error(`squircle.stylex: missing CSS props for variant '${variant.suffix}'`);
  }
  return (radius: string, amt: string | number = DEFAULT_AMT_CSS) =>
    buildStyle(props, radius, amt);
}

/**
 * Build the squircle style object for one variant. Returns a plain object
 * literal in StyleX's per-property conditional-value shape:
 *
 * ```ts
 * {
 *   borderRadius: { default: '1rem', '@supports (...)': 'calc(...)' },
 *   cornerShape:  { default: null,   '@supports (...)': 'superellipse(...)' },
 * }
 * ```
 *
 * Suitable for build-time codegen, non-StyleX CSS-in-JS, or inline `style=`
 * props. **Not** for direct use inside `stylex.create(...)` — see module
 * docstring.
 */
export const squircle = helperFor(CAMEL_VARIANTS[0]!);

export const squircleTop = helperFor(CAMEL_VARIANTS[1]!);
export const squircleRight = helperFor(CAMEL_VARIANTS[2]!);
export const squircleBottom = helperFor(CAMEL_VARIANTS[3]!);
export const squircleLeft = helperFor(CAMEL_VARIANTS[4]!);
export const squircleStart = helperFor(CAMEL_VARIANTS[5]!);
export const squircleEnd = helperFor(CAMEL_VARIANTS[6]!);
export const squircleTopLeft = helperFor(CAMEL_VARIANTS[7]!);
export const squircleTopRight = helperFor(CAMEL_VARIANTS[8]!);
export const squircleBottomRight = helperFor(CAMEL_VARIANTS[9]!);
export const squircleBottomLeft = helperFor(CAMEL_VARIANTS[10]!);
export const squircleStartStart = helperFor(CAMEL_VARIANTS[11]!);
export const squircleStartEnd = helperFor(CAMEL_VARIANTS[12]!);
export const squircleEndStart = helperFor(CAMEL_VARIANTS[13]!);
export const squircleEndEnd = helperFor(CAMEL_VARIANTS[14]!);

const HELPER_BY_SIDE: Record<CamelVariant["side"], (r: string, amt?: string | number) => SquircleStyleObject> =
  {
    all: squircle,
    top: squircleTop,
    right: squircleRight,
    bottom: squircleBottom,
    left: squircleLeft,
    start: squircleStart,
    end: squircleEnd,
    topLeft: squircleTopLeft,
    topRight: squircleTopRight,
    bottomRight: squircleBottomRight,
    bottomLeft: squircleBottomLeft,
    startStart: squircleStartStart,
    startEnd: squircleStartEnd,
    endStart: squircleEndStart,
    endEnd: squircleEndEnd,
  };

export interface DefineSquircleVariantsOptions {
  /**
   * Which side/corner the generated variants target. Defaults to `'all'` (all
   * four corners via `borderRadius`).
   */
  side?: CamelVariant["side"];
  /** Override the `--squircle-amt` reading expression. */
  amt?: string | number;
}

/**
 * Build a `{ key: SquircleStyleObject }` map from a `{ key: radius }` input.
 * Useful as a build-time codegen helper to assemble the literal that you'll
 * paste into a `stylex.create({...})` source file.
 */
export function defineSquircleVariants<V extends Record<string, string>>(
  vars: V,
  options: DefineSquircleVariantsOptions = {},
): { [K in keyof V]: SquircleStyleObject } {
  const helper = HELPER_BY_SIDE[options.side ?? "all"];
  const amt = options.amt;
  const out = {} as { [K in keyof V]: SquircleStyleObject };
  for (const key of Object.keys(vars) as Array<keyof V>) {
    const radius = vars[key] as string;
    out[key] = amt === undefined ? helper(radius) : helper(radius, amt);
  }
  return out;
}
