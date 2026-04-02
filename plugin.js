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
