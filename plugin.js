import plugin from "tailwindcss/plugin";

const correctedRadius = (value) =>
  `calc(${value} * (1 - pow(2, -0.5)) / (1 - pow(2, -1 * pow(2, -1 * var(--squircle-amt, 1.5)))))`;

const cornerShape = "superellipse(var(--squircle-amt, 1.5))";

const supportsCornerShape = "@supports (corner-shape: superellipse())";

export default plugin(function ({ matchUtilities, theme }) {
  const radiusValues = theme("borderRadius");

  // squircle-amt-* — sets exponent + corner-shape
  matchUtilities(
    {
      "squircle-amt": (value) => ({
        "--squircle-amt": value,
        [supportsCornerShape]: {
          "corner-shape": "superellipse(var(--squircle-amt))",
        },
      }),
    },
    { type: "number" },
  );

  // squircle-* — all corners (uses intermediate --squircle-r variable)
  matchUtilities(
    {
      squircle: (value) => ({
        "border-radius": value,
        [supportsCornerShape]: {
          "--squircle-r": correctedRadius(value),
          "border-radius": "var(--squircle-r)",
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  // --- Per-side physical variants (use intermediate --squircle-r variable) ---

  // squircle-t-* — top-left + top-right
  matchUtilities(
    {
      "squircle-t": (value) => ({
        "border-top-left-radius": value,
        "border-top-right-radius": value,
        [supportsCornerShape]: {
          "--squircle-r": correctedRadius(value),
          "border-top-left-radius": "var(--squircle-r)",
          "border-top-right-radius": "var(--squircle-r)",
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  // squircle-r-* — top-right + bottom-right
  matchUtilities(
    {
      "squircle-r": (value) => ({
        "border-top-right-radius": value,
        "border-bottom-right-radius": value,
        [supportsCornerShape]: {
          "--squircle-r": correctedRadius(value),
          "border-top-right-radius": "var(--squircle-r)",
          "border-bottom-right-radius": "var(--squircle-r)",
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  // squircle-b-* — bottom-left + bottom-right
  matchUtilities(
    {
      "squircle-b": (value) => ({
        "border-bottom-left-radius": value,
        "border-bottom-right-radius": value,
        [supportsCornerShape]: {
          "--squircle-r": correctedRadius(value),
          "border-bottom-left-radius": "var(--squircle-r)",
          "border-bottom-right-radius": "var(--squircle-r)",
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  // squircle-l-* — top-left + bottom-left
  matchUtilities(
    {
      "squircle-l": (value) => ({
        "border-top-left-radius": value,
        "border-bottom-left-radius": value,
        [supportsCornerShape]: {
          "--squircle-r": correctedRadius(value),
          "border-top-left-radius": "var(--squircle-r)",
          "border-bottom-left-radius": "var(--squircle-r)",
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  // --- Per-side logical variants (use intermediate --squircle-r variable) ---

  // squircle-s-* — start-start + end-start (inline-start side)
  matchUtilities(
    {
      "squircle-s": (value) => ({
        "border-start-start-radius": value,
        "border-end-start-radius": value,
        [supportsCornerShape]: {
          "--squircle-r": correctedRadius(value),
          "border-start-start-radius": "var(--squircle-r)",
          "border-end-start-radius": "var(--squircle-r)",
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  // squircle-e-* — start-end + end-end (inline-end side)
  matchUtilities(
    {
      "squircle-e": (value) => ({
        "border-start-end-radius": value,
        "border-end-end-radius": value,
        [supportsCornerShape]: {
          "--squircle-r": correctedRadius(value),
          "border-start-end-radius": "var(--squircle-r)",
          "border-end-end-radius": "var(--squircle-r)",
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  // --- Per-corner physical variants (NO intermediate variable, direct calc) ---

  // squircle-tl-*
  matchUtilities(
    {
      "squircle-tl": (value) => ({
        "border-top-left-radius": value,
        [supportsCornerShape]: {
          "border-top-left-radius": correctedRadius(value),
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  // squircle-tr-*
  matchUtilities(
    {
      "squircle-tr": (value) => ({
        "border-top-right-radius": value,
        [supportsCornerShape]: {
          "border-top-right-radius": correctedRadius(value),
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  // squircle-br-*
  matchUtilities(
    {
      "squircle-br": (value) => ({
        "border-bottom-right-radius": value,
        [supportsCornerShape]: {
          "border-bottom-right-radius": correctedRadius(value),
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  // squircle-bl-*
  matchUtilities(
    {
      "squircle-bl": (value) => ({
        "border-bottom-left-radius": value,
        [supportsCornerShape]: {
          "border-bottom-left-radius": correctedRadius(value),
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  // --- Per-corner logical variants (NO intermediate variable, direct calc) ---

  // squircle-ss-*
  matchUtilities(
    {
      "squircle-ss": (value) => ({
        "border-start-start-radius": value,
        [supportsCornerShape]: {
          "border-start-start-radius": correctedRadius(value),
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  // squircle-se-*
  matchUtilities(
    {
      "squircle-se": (value) => ({
        "border-start-end-radius": value,
        [supportsCornerShape]: {
          "border-start-end-radius": correctedRadius(value),
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  // squircle-es-*
  matchUtilities(
    {
      "squircle-es": (value) => ({
        "border-end-start-radius": value,
        [supportsCornerShape]: {
          "border-end-start-radius": correctedRadius(value),
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );

  // squircle-ee-*
  matchUtilities(
    {
      "squircle-ee": (value) => ({
        "border-end-end-radius": value,
        [supportsCornerShape]: {
          "border-end-end-radius": correctedRadius(value),
          "corner-shape": cornerShape,
        },
      }),
    },
    { type: "length", values: radiusValues },
  );
});
