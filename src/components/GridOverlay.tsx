import React from "react";

export function pctToGrid(xPct: number, yPct: number, rows: number, cols: number) {
  const col = Math.min(cols - 1, Math.max(0, Math.floor((xPct / 100) * cols)));
  const row = Math.min(rows - 1, Math.max(0, Math.floor((yPct / 100) * rows)));
  const letter = String.fromCharCode(65 + col); // A..Z
  return `${letter}${row + 1}`; // ex: "M12"
}

export default function GridOverlay({
  rows = 20,
  cols = 26,
  show = true,
}: {
  rows?: number;
  cols?: number;
  show?: boolean;
}) {
  if (!show) return null;

  const letters = Array.from({ length: cols }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none z-10"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {/* Lignes verticales */}
      {Array.from({ length: cols + 1 }, (_, i) => {
        const x = (i * 100) / cols;
        return (
          <line
            key={`v-${i}`}
            x1={x}
            y1={0}
            x2={x}
            y2={100}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.3"
          />
        );
      })}

      {/* Lignes horizontales */}
      {Array.from({ length: rows + 1 }, (_, i) => {
        const y = (i * 100) / rows;
        return (
          <line
            key={`h-${i}`}
            x1={0}
            y1={y}
            x2={100}
            y2={y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.3"
          />
        );
      })}

      {/* Labels colonnes (A..Z) */}
      {letters.map((L, i) => {
        const x = ((i + 0.5) * 100) / cols;
        return (
          <text
            key={`c-${L}`}
            x={x}
            y={3}
            textAnchor="middle"
            fontSize="2.6"
            fill="rgba(255,255,255,0.35)"
          >
            {L}
          </text>
        );
      })}

      {/* Labels lignes (1..X) */}
      {Array.from({ length: rows }, (_, i) => {
        const y = ((i + 0.5) * 100) / rows;
        return (
          <text
            key={`r-${i}`}
            x={1.5}
            y={y}
            textAnchor="start"
            dominantBaseline="middle"
            fontSize="2.6"
            fill="rgba(255,255,255,0.35)"
          >
            {i + 1}
          </text>
        );
      })}
    </svg>
  );
}