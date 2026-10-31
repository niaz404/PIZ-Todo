"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { formatCoins } from "../lib/utils";
import { Check, Flame, TrendingUp, Zap } from "./icons";

function makeSmoothPath(points) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function makeSmoothAreaPath(points, baseline) {
  if (points.length === 0) return "";
  const line = makeSmoothPath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
}

export function CoinFlowChart({ history = [], height = 240, compact = false }) {
  const earnedGradientId = `earned-${useId().replace(/:/g, "")}`;
  const lossGradientId = `loss-${useId().replace(/:/g, "")}`;
  const glowId = `glow-${useId().replace(/:/g, "")}`;
  const data = history.length > 0 ? history : [];
  const width = 1000;
  const padding = compact
    ? { top: 16, right: 16, bottom: 24, left: 16 }
    : { top: 22, right: 24, bottom: 32, left: 48 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const [activePoint, setActivePoint] = useState(null);

  const maxValue = Math.max(
    100,
    ...data.map((day) => Math.max(day.earned || 0, (day.fined || 0) + (day.spent || 0))),
  );
  const max = Math.ceil(maxValue / 50) * 50;

  const x = (index) =>
    data.length <= 1
      ? padding.left + innerWidth / 2
      : padding.left + (index / (data.length - 1)) * innerWidth;
  const y = (value) =>
    padding.top + innerHeight - (Math.max(0, value) / max) * innerHeight;
  const baseline = padding.top + innerHeight;

  const earnedPoints = data.map((day, index) => ({
    x: x(index),
    y: y(day.earned || 0),
    value: day.earned || 0,
    day,
    index,
  }));
  const lossPoints = data.map((day, index) => ({
    x: x(index),
    y: y((day.fined || 0) + (day.spent || 0)),
    value: (day.fined || 0) + (day.spent || 0),
    day,
    index,
  }));

  const gridValues = [0, 0.33, 0.66, 1].map((ratio) => Math.round(max * ratio));

  return (
    <div
      className="relative w-full select-none"
      onMouseLeave={() => setActivePoint(null)}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Monthly coin velocity graph"
        className="h-auto w-full overflow-visible"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mouseX = ((e.clientX - rect.left) / rect.width) * width;
          let closest = null;
          let minDistance = Infinity;
          earnedPoints.forEach((p) => {
            const dist = Math.abs(p.x - mouseX);
            if (dist < minDistance) {
              minDistance = dist;
              closest = p;
            }
          });
          if (closest && minDistance < innerWidth / (data.length || 1) + 20) {
            setActivePoint(closest);
          } else {
            setActivePoint(null);
          }
        }}
      >
        <defs>
          {/* Refined Gold Gradient for Earned Coins */}
          <linearGradient id={earnedGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dcc79a" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#dcc79a" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#dcc79a" stopOpacity="0.0" />
          </linearGradient>

          {/* Danger Gradient for Fined/Spent */}
          <linearGradient id={lossGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
          </linearGradient>

          {/* Soft Filter Glow */}
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Horizontal Grid Lines & Values */}
        {gridValues.map((v) => {
          const yPos = y(v);
          return (
            <g key={v}>
              <line
                x1={padding.left}
                y1={yPos}
                x2={width - padding.right}
                y2={yPos}
                stroke="rgba(255, 255, 255, 0.04)"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              {!compact && (
                <text
                  x={padding.left - 10}
                  y={yPos + 3.5}
                  textAnchor="end"
                  fill="rgba(149, 143, 132, 0.65)"
                  fontSize="9.5"
                  fontFamily="var(--font-geist-sans)"
                >
                  {formatCoins(v)}
                </text>
              )}
            </g>
          );
        })}

        {/* Fined Area & Line */}
        <path
          d={makeSmoothAreaPath(lossPoints, baseline)}
          fill={`url(#${lossGradientId})`}
        />
        <path
          d={makeSmoothPath(lossPoints)}
          fill="none"
          stroke="#ef4444"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="3 3"
          opacity={0.7}
        />

        {/* Earned Area & Line (Cubic Bezier curve with warm gold stroke) */}
        <path
          d={makeSmoothAreaPath(earnedPoints, baseline)}
          fill={`url(#${earnedGradientId})`}
        />
        <path
          d={makeSmoothPath(earnedPoints)}
          fill="none"
          stroke="#dcc79a"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glowId})`}
        />

        {/* Active Hover Hairline Guide */}
        {activePoint ? (
          <g>
            <line
              x1={activePoint.x}
              y1={padding.top}
              x2={activePoint.x}
              y2={baseline}
              stroke="rgba(220, 199, 154, 0.4)"
              strokeWidth={1.2}
              strokeDasharray="3 3"
            />
            {/* Target Pulse Indicator on Earned */}
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r={6}
              fill="#dcc79a"
              className="animate-ping opacity-60"
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r={4.5}
              fill="#171a20"
              stroke="#dcc79a"
              strokeWidth={2}
            />
          </g>
        ) : null}

        {/* Dynamic Nodes & Day Labels */}
        {data.map((day, index) => {
          const isLast = index === data.length - 1;
          const isActive = activePoint && activePoint.index === index;
          const step = Math.max(1, Math.floor(data.length / 8));
          const showLabel = !compact && (index % step === 0 || isLast);

          return (
            <g key={day.date}>
              <circle
                cx={x(index)}
                cy={y(day.earned || 0)}
                r={isActive ? 5.5 : isLast ? 4 : 2.5}
                fill={isActive ? "#f8ecd0" : isLast ? "#dcc79a" : "#9e8854"}
                stroke="#171a20"
                strokeWidth={isActive ? 2 : 1}
                className="transition-all duration-150"
              />
              {showLabel ? (
                <text
                  x={x(index)}
                  y={height - 8}
                  textAnchor="middle"
                  fill="rgba(149, 143, 132, 0.75)"
                  fontSize="9.5"
                  fontFamily="var(--font-geist-sans)"
                >
                  {day.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* Floating Modern Glass Tooltip */}
      {activePoint ? (
        <div
          className="pointer-events-none absolute -top-3 z-20 -translate-x-1/2 -translate-y-full rounded-2xl border border-white/[0.1] bg-[#141820]/95 px-3.5 py-2.5 shadow-xl backdrop-blur-md transition-all duration-150 text-xs"
          style={{
            left: `${(activePoint.x / width) * 100}%`,
          }}
        >
          <p className="text-[10px] uppercase tracking-[0.14em] text-faint">
            {activePoint.day.label || activePoint.day.date}
          </p>
          <div className="mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1 font-semibold text-accent">
              +{formatCoins(activePoint.day.earned || 0)} earned
            </span>
            {(activePoint.day.fined || 0) + (activePoint.day.spent || 0) > 0 ? (
              <span className="flex items-center gap-1 font-semibold text-danger">
                -{formatCoins((activePoint.day.fined || 0) + (activePoint.day.spent || 0))} burned
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Website theme palette: Dark surface to refined warm gold
export const STREAK_COLORS = [
  "#161a22", // Level 0: 0 tasks (dark subtle slate)
  "#423724", // Level 1: 1 task (warm bronze)
  "#7c6436", // Level 2: 2 tasks (medium amber gold)
  "#bfa260", // Level 3: 3-4 tasks (rich satin gold)
  "#ecd59f", // Level 4: 5+ tasks (refined warm PIZ gold)
];

function getGithubContributionColor(completed) {
  if (!completed || completed <= 0) {
    return {
      bg: "bg-[#161a22]",
      border: "border-white/[0.04]",
      glow: "",
    };
  }
  if (completed === 1) {
    return {
      bg: "bg-[#423724]",
      border: "border-accent/20",
      glow: "",
    };
  }
  if (completed <= 3) {
    return {
      bg: "bg-[#7c6436]",
      border: "border-accent/35",
      glow: "",
    };
  }
  if (completed <= 5) {
    return {
      bg: "bg-[#bfa260]",
      border: "border-accent/50",
      glow: "shadow-[0_0_8px_rgba(220,199,154,0.2)]",
    };
  }
  return {
    bg: "bg-[#ecd59f]",
    border: "border-white/40",
    glow: "shadow-[0_0_12px_rgba(220,199,154,0.45)]",
  };
}

export function GithubStreakHeatmap({
  history = [],
  monthHistory = [],
  streak = 0,
  onMonthStats,
}) {
  const weeks = useMemo(() => {
    const list = history.length > 0 ? history : [];
    const grouped = [];
    for (let i = 0; i < list.length; i += 7) {
      grouped.push(list.slice(i, i + 7));
    }
    return grouped;
  }, [history]);

  // Current month metrics
  const monthData = useMemo(() => {
    const today = new Date();
    const currentMonthName = today.toLocaleString("en-US", { month: "long" });
    const currentYear = today.getFullYear();
    const mList = Array.isArray(monthHistory) && monthHistory.length > 0
      ? monthHistory
      : history.filter((d) => d && d.date && d.date.startsWith(`${currentYear}-`));

    const totalTasks = mList.reduce((sum, day) => sum + (day.completed || 0), 0);
    const activeDays = mList.filter((day) => (day.completed || 0) > 0).length;
    const totalPossible = mList.reduce(
      (sum, day) => sum + (day.completed || 0) + (day.missed || 0),
      0,
    );
    const rate = totalPossible > 0 ? Math.round((totalTasks / totalPossible) * 100) : 0;

    return {
      monthName: currentMonthName,
      totalTasks,
      activeDays,
      rate,
    };
  }, [monthHistory, history]);

  useEffect(() => {
    onMonthStats?.({
      streak: streak,
      tasks: monthData.totalTasks,
      monthName: monthData.monthName,
      activeDays: monthData.activeDays,
    });
  }, [streak, monthData, onMonthStats]);

  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = "";
    weeks.forEach((week, wIndex) => {
      const firstDay = week[0];
      if (firstDay && firstDay.label) {
        const mName = firstDay.label.split(" ")[0];
        if (mName && mName !== lastMonth) {
          labels.push({ weekIndex: wIndex, month: mName });
          lastMonth = mName;
        }
      }
    });
    return labels;
  }, [weeks]);

  const weekDayLabels = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

  return (
    <div className="w-full">
      {/* Top Streak & Accountability Stats Bar (Strictly Month-Based) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="neu-inset-soft rounded-2xl p-4">
          <div className="flex items-center justify-between text-faint">
            <span className="text-[9px] uppercase tracking-[0.16em]">Month Streak</span>
            <Flame className="size-4 text-accent" />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
            {streak} <span className="text-xs font-normal text-muted">days</span>
          </p>
          <p className="mt-1 text-[10px] text-faint">Consecutive in {monthData.monthName}</p>
        </div>

        <div className="neu-inset-soft rounded-2xl p-4">
          <div className="flex items-center justify-between text-faint">
            <span className="text-[9px] uppercase tracking-[0.16em]">Tasks Finished</span>
            <Check className="size-4 text-success" />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
            {monthData.totalTasks} <span className="text-xs font-normal text-muted">tasks</span>
          </p>
          <p className="mt-1 text-[10px] text-faint">Finished in {monthData.monthName}</p>
        </div>

        <div className="neu-inset-soft rounded-2xl p-4">
          <div className="flex items-center justify-between text-faint">
            <span className="text-[9px] uppercase tracking-[0.16em]">Active Days</span>
            <Zap className="size-4 text-accent" />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
            {monthData.activeDays} <span className="text-xs font-normal text-muted">days</span>
          </p>
          <p className="mt-1 text-[10px] text-faint">Active days in {monthData.monthName}</p>
        </div>

        <div className="neu-inset-soft rounded-2xl p-4">
          <div className="flex items-center justify-between text-faint">
            <span className="text-[9px] uppercase tracking-[0.16em]">Consistency</span>
            <TrendingUp className="size-4 text-accent" />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
            {monthData.rate}%
          </p>
          <p className="mt-1 text-[10px] text-faint">Monthly completion rate</p>
        </div>
      </div>

      {/* GitHub Calendar Grid (Clean Full-Width Matrix) */}
      <div className="mt-6 overflow-x-auto pb-2">
        <div className="min-w-[650px] w-full">
          {/* Month headers across top */}
          <div className="flex pl-8 text-[10px] text-faint">
            {weeks.map((week, wIndex) => {
              const matched = monthLabels.find((m) => m.weekIndex === wIndex);
              return (
                <div key={wIndex} className="flex-1 text-left">
                  {matched ? (
                    <span className="font-semibold text-accent/90">{matched.month}</span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Grid rows */}
          <div className="mt-2 flex items-center gap-2">
            {/* Weekday labels */}
            <div className="flex flex-col justify-between py-1 text-[9px] text-faint/70 pr-2 select-none h-full">
              {weekDayLabels.map((lbl, idx) => (
                <span key={idx} className="h-4 sm:h-5 flex items-center">
                  {lbl}
                </span>
              ))}
            </div>

            {/* Week columns spanning full width */}
            <div className="flex flex-1 justify-between gap-1.5 sm:gap-2">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-1 flex-col gap-1.5 sm:gap-2 items-center">
                  {week.map((day) => {
                    const style = getGithubContributionColor(day.completed);
                    const tooltipText = `${day.label || day.date}: ${day.completed || 0} completed${
                      day.earned ? ` · +${formatCoins(day.earned)} coins` : ""
                    }`;

                    return (
                      <div
                        key={day.date}
                        title={tooltipText}
                        aria-label={tooltipText}
                        className={`w-full max-w-[26px] aspect-square rounded-[3.5px] border transition-all duration-150 hover:scale-125 hover:z-10 cursor-pointer ${style.bg} ${style.border} ${style.glow}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend & Summary */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05] pt-3 text-[10px] text-faint">
        <span>{monthData.totalTasks} tasks completed in {monthData.monthName}</span>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <span
            title="0 tasks"
            className="size-3 rounded-[2.5px] border border-white/[0.04] bg-[#161a22]"
          />
          <span
            title="1 task"
            className="size-3 rounded-[2.5px] border border-accent/20 bg-[#423724]"
          />
          <span
            title="2-3 tasks"
            className="size-3 rounded-[2.5px] border border-accent/35 bg-[#7c6436]"
          />
          <span
            title="4-5 tasks"
            className="size-3 rounded-[2.5px] border border-accent/50 bg-[#bfa260]"
          />
          <span
            title="5+ tasks"
            className="size-3 rounded-[2.5px] border border-white/40 bg-[#ecd59f]"
          />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

export function ConsistencyHeatmap(props) {
  return <GithubStreakHeatmap {...props} />;
}
