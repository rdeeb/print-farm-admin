import React from "react";

type PrinterLoaderIconProps = {
  size?: number;            // px
  strokeWidth?: number;     // svg units
  color?: string;           // any CSS color
  xAmplitude?: number;      // px-ish in viewBox units
  yRise?: number;           // px-ish in viewBox units
  xDurationMs?: number;
  yDurationMs?: number;
  className?: string;
};

export function PrinterLoaderIcon({
  size = 128,
  strokeWidth = 12,
  color = "currentColor",
  xAmplitude = 36,
  yRise = 28,
  xDurationMs = 900,
  yDurationMs = 2400,
  className,
}: PrinterLoaderIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 256 256"
      role="img"
      aria-label="Loading"
      style={{ color }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{`
        @keyframes toolhead-x {
          0%   { transform: translateX(${-xAmplitude}px); }
          50%  { transform: translateX(${xAmplitude}px); }
          100% { transform: translateX(${-xAmplitude}px); }
        }

        /* slow rise up, then reset back down (loop) */
        @keyframes toolhead-y {
          0%   { transform: translateY(0px); }
          85%  { transform: translateY(${-yRise}px); }
          100% { transform: translateY(0px); }
        }

        .toolhead-y {
          animation: toolhead-y ${yDurationMs}ms linear infinite;
          transform-origin: 128px 80px; /* center-ish of carriage */
        }
        .toolhead-x {
          animation: toolhead-x ${xDurationMs}ms ease-in-out infinite;
          transform-origin: 128px 80px;
        }
      `}</style>

      {/* Monoline icon: single-color (currentColor), no fill */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* X-axis rail */}
        <line x1="44" y1="74" x2="212" y2="74" />
        <line x1="60" y1="94" x2="196" y2="94" />

        {/* Rail end blocks */}
        <rect x="26" y="54" width="34" height="40" rx="10" ry="10" />
        <rect x="196" y="54" width="34" height="40" rx="10" ry="10" />

        {/* Bed (plate) */}
        <path d="M64 168 L192 168 L214 190 L42 190 Z" />
        <line x1="42" y1="190" x2="214" y2="190" />
        <line x1="64" y1="168" x2="42" y2="190" />
        <line x1="192" y1="168" x2="214" y2="190" />

        {/* Feet */}
        <rect x="64" y="196" width="44" height="18" rx="6" ry="6" />
        <rect x="148" y="196" width="44" height="18" rx="6" ry="6" />

        {/* ===== Animated toolhead (nested transforms) ===== */}
        <g className="toolhead-y">
          <g className="toolhead-x">
            {/* Toolhead carriage */}
            <rect x="98" y="48" width="60" height="64" rx="12" ry="12" />
            <rect x="110" y="72" width="36" height="28" rx="8" ry="8" />

            {/* Neck */}
            <path d="M118 112 H138 V130 H118 Z" />

            {/* Nozzle */}
            <path d="M128 132 L114 154 H142 Z" />
          </g>
        </g>
      </g>
    </svg>
  );
}
