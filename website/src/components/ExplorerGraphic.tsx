import { useId, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  circleArcPoints,
  correctedRadius,
  perceivedRadius,
  pointsToPath,
  superellipsePoints,
} from "../math";

export interface ArcStyle {
  visible: boolean;
  showFill: boolean;
  showOutline: boolean;
}

export interface GraphicState {
  arcRounded: ArcStyle;
  arcSuperellipse: ArcStyle;
  correctionAmount: number; // 0 = uncorrected superellipse, 1 = fully corrected
  amount: number;
  showRefLine: boolean;
  showMeasurement: boolean;
  measureArc?: "rounded" | "superellipse" | "corrected";
  measureMode?: "perceived" | "radius";
  measureAngle?: "diagonal" | "edge"; // default: "diagonal"
  zoom: number;
}

const BOX = 180;
const PAD = 10;
const PAD_EXTRA = 20; // extra padding on top and right for serifs/labels
const cornerX = PAD + BOX; // 190
const cornerY = PAD; // 10
const DASH = "4 3";
const DASH_PERIOD = 7;
const SERIF_LEN = 14;
const SERIF_W = 1;

function arcToSvg(mathX: number, mathY: number, arcR: number) {
  return { x: cornerX - arcR + mathX, y: cornerY + arcR - mathY };
}

function buildCurvePath(points: { x: number; y: number }[]) {
  const first = points[0]!;
  return (
    `M ${cornerX} ${PAD + BOX} L ${first.x} ${first.y} ` +
    pointsToPath(points).slice(2) +
    ` L ${PAD} ${cornerY}`
  );
}

export default function ExplorerGraphic({
  arcRounded,
  arcSuperellipse,
  amount,
  showRefLine,
  showMeasurement,
  measureArc,
  measureMode = "radius",
  measureAngle = "diagonal",
  correctionAmount,
  zoom,
}: GraphicState) {
  const id = useId();
  const clipCircle = `${id}-clip-circle`;
  const clipSuper = `${id}-clip-super`;

  // Track discrete measurement state changes to decide when to animate vs instant update
  const measureKey = `${showRefLine}-${showMeasurement}-${measureArc}-${measureMode}-${measureAngle}`;
  const prevMeasureKey = useRef(measureKey);
  const isMorphing = prevMeasureKey.current !== measureKey;
  prevMeasureKey.current = measureKey;

  const data = useMemo(() => {
    const mathN = Math.pow(2, amount);
    const r = BOX * zoom;
    const corrR = correctedRadius(r, mathN);

    // Interpolated superellipse radius based on correction amount
    const superR = r + correctionAmount * (corrR - r);

    // Circle arc points
    const circleRaw = circleArcPoints(r);
    const circleSvg = circleRaw.map((p) => arcToSvg(p.x, p.y, r));

    // Superellipse points (interpolated between uncorrected and corrected)
    const superRaw = superellipsePoints(superR, mathN);
    const superSvg = superRaw.map((p) => arcToSvg(p.x, p.y, superR));

    // Paths
    const circlePath = buildCurvePath(circleSvg);
    const superPath = buildCurvePath(superSvg);

    // Interior clip: same shape as the curve path, closed
    const circleClip = circlePath + " Z";
    const superClip = superPath + " Z";

    // Determine z-order: superellipse above circle when its perceived radius
    // is smaller (curve closer to corner), below when larger (curve past circle)
    const circlePerceived = perceivedRadius(r, r, 2);
    const superPerceived = perceivedRadius(r, superR, mathN);
    const superAboveCircle = superPerceived <= circlePerceived;

    // Measurement line data
    let measure: {
      x1: number;
      y1: number;
      endX: number;
      endY: number;
      ratio: number;
      cssVar: string;
    } | null = null;
    if (measureArc) {
      const arcR = measureArc === "corrected" ? superR : r;
      const n = measureArc === "rounded" ? 2 : mathN;
      let x1: number, y1: number, endX: number, endY: number, lineLen: number;
      const centerX = cornerX - arcR;
      const centerY = cornerY + arcR;
      if (measureMode === "radius") {
        x1 = centerX;
        y1 = centerY;
        if (measureAngle === "edge") {
          // Horizontal: from arc center to right edge
          endX = centerX + arcR;
          endY = centerY;
        } else {
          // Diagonal: from arc center outward along 45°
          endX = centerX + arcR / Math.SQRT2;
          endY = centerY - arcR / Math.SQRT2;
        }
        lineLen = arcR;
      } else {
        // Perceived mode
        const d = arcR * (1 - Math.pow(2, -1 / n));
        if (measureAngle === "edge") {
          // Horizontal: from right edge inward by the junction offset
          const junctionX = cornerX - arcR + superellipsePoints(arcR, n, 1)[0]!.x;
          x1 = cornerX;
          y1 = cornerY + arcR;
          endX = junctionX;
          endY = cornerY + arcR;
          lineLen = cornerX - junctionX;
        } else {
          // Diagonal: from corner to curve apex
          x1 = cornerX;
          y1 = cornerY;
          endX = cornerX - d;
          endY = cornerY + d;
          lineLen = Math.sqrt(2) * d;
        }
      }
      const ratio = lineLen / r;
      const cssVar =
        measureArc === "rounded"
          ? "--color-rounded-border"
          : measureArc === "superellipse"
            ? "--color-squircle-border"
            : "--color-adjusted-border";
      measure = { x1, y1, endX, endY, ratio, cssVar };
    }

    return {
      mathN,
      r,
      superR,
      circleSvg,
      superSvg,
      circlePath,
      superPath,
      circleClip,
      superClip,
      superAboveCircle,
      measure,
      // Reference line: circle arc center outward at 45° toward corner (length = r)
      refLine: {
        x1: cornerX - r,
        y1: cornerY + r,
        x2: cornerX - r + r / Math.SQRT2,
        y2: cornerY + r - r / Math.SQRT2,
      },
    };
  }, [amount, measureArc, measureMode, measureAngle, zoom, correctionAmount]);

  const {
    circleSvg,
    superSvg,
    circlePath,
    superPath,
    circleClip,
    superClip,
    superAboveCircle,
    measure,
    refLine,
  } = data;

  return (
    <svg
      viewBox={`${PAD} ${PAD - PAD_EXTRA} ${BOX + PAD_EXTRA} ${BOX + PAD_EXTRA}`}
      className="w-full max-w-md"
    >
      <defs>
        <clipPath id={clipCircle}>
          <path d={circleClip} />
        </clipPath>
        <clipPath id={clipSuper}>
          <path d={superClip} />
        </clipPath>
      </defs>

      {/* Superellipse and circle — z-order swaps when superellipse crosses circle */}
      {(() => {
        const isCorrepting = correctionAmount > 0;
        const superFillColor = isCorrepting
          ? "var(--color-adjusted-fill)"
          : "var(--color-squircle-fill)";
        const superStrokeColor = isCorrepting
          ? "var(--color-adjusted-border)"
          : "var(--color-squircle-border)";

        const superellipseGroup = (
          <motion.g
            key="super"
            animate={{ opacity: arcSuperellipse.visible ? 1 : 0 }}
            transition={{ duration: 0.4 }}
          >
            <g style={{ color: superStrokeColor, transition: "color 0.5s" }}>
              {/* Fill — crossfades in/out */}
              <motion.path
                d={`${superPath} L ${PAD} ${PAD + BOX} Z`}
                style={{ fill: superFillColor, transition: "fill 0.5s" }}
                stroke="none"
                animate={{ opacity: arcSuperellipse.showFill ? 1 : 0 }}
                transition={{ duration: 0.4 }}
              />
              {/* Stroke — crossfades in/out */}
              <motion.g
                animate={{ opacity: arcSuperellipse.showOutline ? 1 : 0 }}
                transition={{ duration: 0.4 }}
              >
                <path
                  d={superPath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeDasharray={DASH}
                  strokeDashoffset={-DASH_PERIOD / 3}
                  clipPath={`url(#${clipSuper})`}
                />
                <line
                  x1={superSvg[0]!.x}
                  y1={superSvg[0]!.y - SERIF_W / 2}
                  x2={superSvg[0]!.x + SERIF_LEN}
                  y2={superSvg[0]!.y - SERIF_W / 2}
                  stroke="currentColor"
                  strokeWidth={SERIF_W}
                />
                <line
                  x1={superSvg[superSvg.length - 1]!.x + SERIF_W / 2}
                  y1={superSvg[superSvg.length - 1]!.y}
                  x2={superSvg[superSvg.length - 1]!.x + SERIF_W / 2}
                  y2={superSvg[superSvg.length - 1]!.y - SERIF_LEN}
                  stroke="currentColor"
                  strokeWidth={SERIF_W}
                />
              </motion.g>
            </g>
          </motion.g>
        );

        const circleGroup = (
          <motion.g
            key="circle"
            animate={{ opacity: arcRounded.visible ? 1 : 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Fill — crossfades in/out */}
            <motion.path
              d={`${circlePath} L ${PAD} ${PAD + BOX} Z`}
              style={{ fill: "var(--color-rounded-fill)" }}
              stroke="none"
              animate={{ opacity: arcRounded.showFill ? 1 : 0 }}
              transition={{ duration: 0.4 }}
            />
            {/* Stroke — crossfades in/out */}
            <motion.g
              animate={{ opacity: arcRounded.showOutline ? 1 : 0 }}
              transition={{ duration: 0.4 }}
            >
              <path
                d={circlePath}
                fill="none"
                style={{ stroke: "var(--color-rounded-border)" }}
                strokeWidth={3}
                strokeDasharray={DASH}
                strokeDashoffset={0}
                clipPath={`url(#${clipCircle})`}
              />
              <line
                x1={circleSvg[0]!.x}
                y1={circleSvg[0]!.y - SERIF_W / 2}
                x2={circleSvg[0]!.x - SERIF_LEN}
                y2={circleSvg[0]!.y - SERIF_W / 2}
                style={{ stroke: "var(--color-rounded-border)" }}
                strokeWidth={SERIF_W}
              />
              <line
                x1={circleSvg[circleSvg.length - 1]!.x + SERIF_W / 2}
                y1={circleSvg[circleSvg.length - 1]!.y}
                x2={circleSvg[circleSvg.length - 1]!.x + SERIF_W / 2}
                y2={circleSvg[circleSvg.length - 1]!.y + SERIF_LEN}
                style={{ stroke: "var(--color-rounded-border)" }}
                strokeWidth={SERIF_W}
              />
            </motion.g>
          </motion.g>
        );

        return superAboveCircle ? (
          <>
            {circleGroup}
            {superellipseGroup}
          </>
        ) : (
          <>
            {superellipseGroup}
            {circleGroup}
          </>
        );
      })()}

      {/* Animated diagonal line — morphs between reference line and measurement line */}
      {(() => {
        const visible = showRefLine || (showMeasurement && measure);
        // When measurement is active, use measurement coords; otherwise use reference line
        const useMeasure = showMeasurement && measure;
        const x1 = useMeasure ? measure!.x1 : refLine.x1;
        const y1 = useMeasure ? measure!.y1 : refLine.y1;
        const x2 = useMeasure ? measure!.endX : refLine.x2;
        const y2 = useMeasure ? measure!.endY : refLine.y2;
        const serifLen = useMeasure ? 24 : 5;
        const label = useMeasure ? measure!.ratio.toFixed(2) : "1";

        // Compute perpendicular direction for serif
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const perpX = -dy / len; // perpendicular unit vector
        const perpY = dx / len;

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const svgW = PAD * 2 + BOX;
        const nearTop = midY - 6 < 12;
        const nearRight = midX + 6 + 24 > svgW;
        const lx = nearRight ? midX - 28 : midX + 6;
        const ly = nearTop ? midY + 12 : midY - 6;

        const strokeColor = useMeasure ? `var(${measure!.cssVar})` : "var(--color-rounded-border)";

        const morphTransition = isMorphing
          ? { type: "spring" as const, stiffness: 200, damping: 25 }
          : { duration: 0 };

        return (
          <motion.g animate={{ opacity: visible ? 1 : 0 }} transition={{ duration: 0.4 }}>
            <g style={{ color: strokeColor, transition: "color 0.5s" }}>
              {/* Main diagonal line */}
              <motion.line
                animate={{ x1, y1, x2, y2 }}
                transition={morphTransition}
                stroke="currentColor"
                strokeWidth={0.75}
                strokeDasharray="1 4"
                strokeLinecap="round"
              />
              {/* Perpendicular serif at the end point */}
              <motion.line
                animate={{
                  x1: x2 - serifLen * perpX,
                  y1: y2 - serifLen * perpY,
                  x2: x2 + serifLen * perpX,
                  y2: y2 + serifLen * perpY,
                }}
                transition={morphTransition}
                stroke="currentColor"
                strokeWidth={0.75}
              />
              {/* Label */}
              <motion.text
                animate={{ x: lx, y: ly }}
                transition={morphTransition}
                fill="currentColor"
                fontSize={9}
                className="text-zinc-400"
              >
                {label}
              </motion.text>
            </g>
          </motion.g>
        );
      })()}
    </svg>
  );
}
