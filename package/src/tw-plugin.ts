import plugin from "tailwindcss/plugin";
import {
  DEFAULT_AMOUNT_VAR_NAME,
  DEFAULT_R_VAR_NAME,
  SUPPORTS_RULE,
  squircleCssObj,
  variantEntries,
} from "./variants";

export interface SquirclePluginOptions {
  /** CSS custom property name for the superellipse amount (default: "--squircle-amt") */
  amtVar?: string;
  /** @plugin CSS alias for amtVar */
  "amt-var"?: string;
  /** CSS custom property name for the intermediate corrected radius (default: "--squircle-r") */
  rVar?: string;
  /** @plugin CSS alias for rVar */
  "r-var"?: string;
  /** Class name prefix for utilities (default: "squircle") */
  prefix?: string;
}

const squircle: ReturnType<typeof plugin.withOptions<SquirclePluginOptions>> =
  plugin.withOptions<SquirclePluginOptions>((options = {}) =>
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ({ matchUtilities, theme }) => {
      const amtVar = options.amtVar ?? options["amt-var"] ?? DEFAULT_AMOUNT_VAR_NAME;
      const rVar = options.rVar ?? options["r-var"] ?? DEFAULT_R_VAR_NAME;
      const prefix = options.prefix ?? "squircle";
      const radiusValues = theme("borderRadius");

      matchUtilities(
        {
          [`${prefix}-amt`]: (value: string) => ({
            [amtVar]: value,
            [SUPPORTS_RULE]: {
              "corner-shape": `superellipse(var(${amtVar}))`,
            },
          }),
        },
        { type: "number" },
      );

      for (const [suffix, props] of variantEntries()) {
        const name = suffix ? `${prefix}-${suffix}` : prefix;
        matchUtilities(
          {
            [name]: (value: string) =>
              squircleCssObj(props, value, { amtVar, rVar }) as Record<
                string,
                string | Record<string, string>
              >,
          },
          { type: "length", values: radiusValues },
        );
      }
    });

export default squircle;
