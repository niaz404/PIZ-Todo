"use client";

import { useId } from "react";

export default function ProgressRing({ value = 0, size = 60 }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  const gradientId = `ring-${useId().replace(/:/g, "")}`;

  const stroke = Math.max(3, Math.round(size * 0.07));
  const inset = 5;
  const radius = (size - inset * 2 - stroke) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      role="img"
      aria-label={`${safe}% complete`}
      className="neu relative grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f0e2c2" />
            <stop offset="100%" stopColor="#c8b07a" />
          </linearGradient>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgb(255 255 255 / 0.07)"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - safe / 100)}
          style={{
            transition:
              "stroke-dashoffset 600ms cubic-bezier(0.22, 1, 0.36, 1)",
            filter: "drop-shadow(0 0 3px rgb(220 199 154 / 0.28))",
          }}
        />
      </svg>
      <span className="relative text-[11px] font-semibold tabular-nums text-ink">
        {safe}%
      </span>
    </div>
  );
}
