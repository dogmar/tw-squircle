import plugin from "tailwindcss/plugin";
import { DEFAULT_AMT, usesIntermediateVar, variantEntries } from "./variants";

type PluginWithConfig = ReturnType<typeof plugin>;

const correctedRadius = (value: string): string =>
  `calc(${value} * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, ${DEFAULT_AMT})))))`;

const cornerShape = `superellipse(var(--squircle-amt, ${DEFAULT_AMT}))`;

const supportsCornerShape: string = "@supports (corner-shape: superellipse())";

// eslint-disable-next-line @typescript-eslint/unbound-method
const squirclePlugin: Parameters<typeof plugin>[0] = ({ matchUtilities, theme }) => {
  const radiusValues = theme("borderRadius");

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

  for (const [suffix, props] of variantEntries()) {
    const name = suffix ? `squircle-${suffix}` : "squircle";

    if (usesIntermediateVar(suffix)) {
      matchUtilities(
        {
          [name]: (value: string) => ({
            ...Object.fromEntries(props.map((p) => [p, value])),
            [supportsCornerShape]: {
              "--squircle-r": correctedRadius(value),
              ...Object.fromEntries(props.map((p) => [p, "var(--squircle-r)"])),
              "corner-shape": cornerShape,
            },
          }),
        },
        { type: "length", values: radiusValues },
      );
    } else {
      const prop = props[0]!;
      matchUtilities(
        {
          [name]: (value: string) => {
            const result: Record<string, string | Record<string, string>> = {
              [prop]: value,
            };
            result[supportsCornerShape] = {
              [prop]: correctedRadius(value),
              "corner-shape": cornerShape,
            };
            return result;
          },
        },
        { type: "length", values: radiusValues },
      );
    }
  }
};

const squircle: PluginWithConfig = plugin(squirclePlugin);
export default squircle;
