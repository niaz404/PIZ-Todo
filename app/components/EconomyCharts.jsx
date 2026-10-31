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
      glow: "",
    };
  }
  if (completed === 1) {
    return {
      bg: "bg-[#423724]",
      glow: "",
    };
  }
  if (completed <= 3) {
    return {
      bg: "bg-[#7c6436]",
      glow: "",
    };
  }
  if (completed <= 5) {
    return {
      bg: "bg-[#bfa260]",
      glow: "shadow-[0_0_8px_rgba(220,199,154,0.2)]",
    };
  }
  return {
    bg: "bg-[#ecd59f]",
    glow: "shadow-[0_0_12px_rgba(220,199,154,0.45)]",
  };
}

export function GithubStreakHeatmap({
  monthHistory = [],
  history = [],
  streak = 0,
  onMonthStats,
}) {
  const [currentDate, setCurrentDate] = useState(() => {
    const sample = monthHistory?.[0]?.date || history?.[0]?.date;
    if (sample) {
      const parts = sample.split("-").map(Number);
      return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
    }
    return new Date(2026, 10, 1);
  });

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const {
    weeks,
    monthName,
    year,
    daysInMonth,
    totalTasks,
    activeDays,
  } = useMemo(() => {
    const today = currentDate;
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentMonthName = today.toLocaleString("en-US", { month: "long" });

    // Exact days in current month (e.g. 30 for November)
    const numDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Map month data by date string
    const historyMap = new Map();
    const sourceList =
      Array.isArray(monthHistory) && monthHistory.length > 0
        ? monthHistory
        : history;

    sourceList.forEach((item) => {
      if (item && item.date) {
        historyMap.set(item.date, item);
      }
    });

    // Day of week of the 1st of the month: 0=Sun, 1=Mon, ..., 6=Sat
    // Convert to Monday=0 ... Sunday=6:
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const leadingBlanks = (firstDayIndex + 6) % 7; // Monday = 0, Sunday = 6

    const flatDays = [];
    let completedCount = 0;
    let activeDaysCount = 0;

    // 1. Invisible padding slots before day 1 of the month
    for (let b = 0; b < leadingBlanks; b++) {
      flatDays.push({
        isPad: true,
        key: `pad-pre-${b}`,
      });
    }

    // 2. Exactly the days of the current month (Day 1 through Day numDays)
    for (let d = 1; d <= numDays; d++) {
      const yStr = String(currentYear);
      const mStr = String(currentMonth + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      const dateKey = `${yStr}-${mStr}-${dStr}`;

      const rec = historyMap.get(dateKey);
      const completed = rec?.completed ?? 0;
      const earned = rec?.earned ?? 0;

      if (completed > 0) {
        completedCount += completed;
        activeDaysCount += 1;
      }

      flatDays.push({
        isPad: false,
        key: dateKey,
        dayNum: d,
        date: dateKey,
        label: `${currentMonthName.slice(0, 3)} ${d}`,
        fullDate: `${currentMonthName} ${d}, ${currentYear}`,
        completed,
        earned,
      });
    }

    // 3. Invisible padding slots to complete the final 7-day column
    const remainder = flatDays.length % 7;
    if (remainder !== 0) {
      const trailingBlanks = 7 - remainder;
      for (let t = 0; t < trailingBlanks; t++) {
        flatDays.push({
          isPad: true,
          key: `pad-post-${t}`,
        });
      }
    }

    // 4. Group into week columns of 7 rows (Mon..Sun)
    const weekCols = [];
    for (let i = 0; i < flatDays.length; i += 7) {
      weekCols.push(flatDays.slice(i, i + 7));
    }

    return {
      weeks: weekCols,
      monthName: currentMonthName,
      year: currentYear,
      daysInMonth: numDays,
      totalTasks: completedCount,
      activeDays: activeDaysCount,
    };
  }, [monthHistory, history, currentDate]);

  useEffect(() => {
    onMonthStats?.({
      streak,
      tasks: totalTasks,
      monthName,
      activeDays,
    });
  }, [streak, totalTasks, monthName, activeDays, onMonthStats]);

  const weekDayLabels = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div>
        {/* Month Header Label */}
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent/90">
          {monthName} {year} · {daysInMonth} Days
        </div>

        {/* GitHub Calendar Grid (Current Month Only) */}
        <div className="overflow-x-auto pb-1">
          <div className="w-fit min-w-[280px]">
            {/* Week Headers across top */}
            <div className="flex items-center gap-2 sm:gap-2.5 mb-1.5 pl-8">
              {weeks.map((_, wIdx) => (
                <div
                  key={wIdx}
                  className="w-7 sm:w-8 md:w-9 text-center text-[9px] font-medium text-faint/70"
                >
                  W{wIdx + 1}
                </div>
              ))}
            </div>

            {/* Grid rows */}
            <div className="flex items-start gap-2 sm:gap-2.5">
              {/* Weekday labels */}
              <div className="flex flex-col gap-2 sm:gap-2.5 text-[9px] text-faint/70 select-none">
                {weekDayLabels.map((lbl, idx) => (
                  <div
                    key={idx}
                    className="w-6 h-7 sm:h-8 md:h-9 flex items-center justify-end pr-1"
                  >
                    {lbl}
                  </div>
                ))}
              </div>

              {/* Week columns of current month */}
              <div className="flex items-center gap-2 sm:gap-2.5">
                {weeks.map((week, wIdx) => (
                  <div
                    key={wIdx}
                    className="flex flex-col gap-2 sm:gap-2.5 items-center"
                  >
                    {week.map((day) => {
                      if (day.isPad) {
                        return (
                          <div
                            key={day.key}
                            className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-[3.5px] opacity-0 pointer-events-none"
                          />
                        );
                      }

                      const style = getGithubContributionColor(day.completed);
                      const tooltipText = `${day.label || day.date}: ${
                        day.completed || 0
                      } completed${
                        day.earned ? ` · +${formatCoins(day.earned)} coins` : ""
                      }`;

                      return (
                        <div
                          key={day.date}
                          title={tooltipText}
                          aria-label={tooltipText}
                          className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-[3.5px] transition-all duration-150 hover:scale-125 hover:z-10 cursor-pointer ${style.bg} ${style.glow}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend & Summary */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05] pt-3 text-[10px] text-faint">
        <span>{totalTasks} tasks completed in {monthName}</span>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <span
            title="0 tasks"
            className="size-3 rounded-[2.5px] bg-[#161a22]"
          />
          <span
            title="1 task"
            className="size-3 rounded-[2.5px] bg-[#423724]"
          />
          <span
            title="2-3 tasks"
            className="size-3 rounded-[2.5px] bg-[#7c6436]"
          />
          <span
            title="4-5 tasks"
            className="size-3 rounded-[2.5px] bg-[#bfa260]"
          />
          <span
            title="5+ tasks"
            className="size-3 rounded-[2.5px] bg-[#ecd59f]"
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
