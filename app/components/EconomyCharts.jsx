"use client";

import { useEffect, useId, useState } from "react";
import { formatCoins } from "../lib/utils";
import { Check, Flame } from "./icons";

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
  "#382d1c", // Level 1: 1 task (warm bronze)
  "#614d25", // Level 2: 2 tasks (medium amber gold)
  "#8a6f35", // Level 3: 3-4 tasks (rich satin gold)
  "#dcc79a", // Level 4: 5+ tasks (refined warm PIZ gold)
];

function getStreakTier(completed) {
  if (!completed || completed <= 0) return 0;
  if (completed === 1) return 1;
  if (completed === 2) return 2;
  if (completed <= 4) return 3;
  return 4;
}

/**
 * Monthly Streak Calendar Display:
 * Strictly monthly based — displays all days of the current month
 * formatted in a 7-column grid with warm gold theme,
 * active streak counter, and day-by-day consistency details.
 */
export function GithubStreakHeatmap({ history = [], onMonthStats }) {
  const [activeHoverDay, setActiveHoverDay] = useState(null);

  const [monthData, setMonthData] = useState(() => {
    return {
      monthName: "This Month",
      year: 2026,
      days: [],
      leadingBlanks: 0,
      currentMonthStreak: 0,
      totalCompletedTasks: 0,
      activeDaysCount: 0,
    };
  });

  useEffect(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentMonthName = today.toLocaleString("en-US", { month: "long" });
    const todayDateNum = today.getDate();

    // Map history entries by date string
    const historyMap = new Map();
    (history || []).forEach((item) => {
      if (item && item.date) {
        historyMap.set(item.date, item);
      }
    });

    // Days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // First day of month (0 = Sun, 1 = Mon ... convert to Mon = 0)
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const leadingBlanks = (firstDayIndex + 6) % 7; // Monday = 0, Sunday = 6

    const days = [];
    let totalCompletedTasks = 0;
    let activeDaysCount = 0;

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const yStr = String(currentYear);
      const mStr = String(currentMonth + 1).padStart(2, "0");
      const dStr = String(dayNum).padStart(2, "0");
      const dateKey = `${yStr}-${mStr}-${dStr}`;

      const record = historyMap.get(dateKey);
      const completed = record?.completed ?? 0;
      const missed = record?.missed ?? 0;
      const earned = record?.earned ?? 0;

      const isToday = dayNum === todayDateNum;
      const isFuture = dayNum > todayDateNum;

      if (completed > 0) {
        totalCompletedTasks += completed;
        activeDaysCount += 1;
      }

      days.push({
        dayNum,
        date: dateKey,
        label: `${currentMonthName.slice(0, 3)} ${dayNum}`,
        fullDate: `${currentMonthName} ${dayNum}, ${currentYear}`,
        completed,
        missed,
        earned,
        isToday,
        isFuture,
        level: getStreakTier(completed),
      });
    }

    // Calculate current month streak: consecutive days from today (or yesterday) backwards
    let monthStreak = 0;
    const todayDayObj = days.find((d) => d.isToday);
    const todayHasDone = (todayDayObj?.completed ?? 0) > 0;
    let checkDay = todayHasDone ? todayDateNum : todayDateNum - 1;

    while (checkDay >= 1) {
      const dayEntry = days.find((d) => d.dayNum === checkDay);
      if (dayEntry && dayEntry.completed > 0) {
        monthStreak += 1;
        checkDay -= 1;
      } else {
        break;
      }
    }

    const payload = {
      monthName: currentMonthName,
      year: currentYear,
      days,
      leadingBlanks,
      currentMonthStreak: monthStreak,
      totalCompletedTasks,
      activeDaysCount,
    };

    setMonthData(payload);

    onMonthStats?.({
      streak: monthStreak,
      tasks: totalCompletedTasks,
      monthName: currentMonthName,
      activeDays: activeDaysCount,
    });
  }, [history, onMonthStats]);

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="w-full space-y-5">
      {/* Monthly Streak Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-faint">
            Monthly Momentum · {monthData.monthName} {monthData.year}
          </p>
          <h2 className="mt-1 font-display text-2xl font-normal text-ink">
            {monthData.monthName} <span className="italic text-accent">Streak Grid.</span>
          </h2>
          <p className="mt-1 text-xs text-muted">
            Track daily task consistency and your consecutive streak throughout this month.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="neu-soft inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold tabular-nums text-ink">
            <Flame className="size-3.5 text-accent" />
            <span className="text-accent">{monthData.currentMonthStreak}d</span> Month Streak
          </span>

          <span className="neu-soft inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium tabular-nums text-muted">
            <Check className="size-3.5 text-accent" />
            <span className="font-semibold text-ink">{monthData.totalCompletedTasks}</span> Tasks Done
          </span>
        </div>
      </div>

      {/* Monthly 7-Column Calendar Grid */}
      <div className="relative rounded-[24px] border border-white/[0.05] bg-white/[0.015] p-4 sm:p-6">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center mb-3">
          {weekdays.map((wd) => (
            <span
              key={wd}
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint"
            >
              {wd}
            </span>
          ))}
        </div>

        {/* Day Tiles */}
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {/* Pre-month empty padding cells */}
          {Array.from({ length: monthData.leadingBlanks }).map((_, idx) => (
            <div
              key={`blank-${idx}`}
              className="aspect-square rounded-2xl border border-dashed border-white/[0.03] bg-transparent opacity-20"
            />
          ))}

          {/* Days of the Month */}
          {monthData.days.map((day) => {
            const isLevel0 = day.level === 0;
            const isLevel1 = day.level === 1;
            const isLevel2 = day.level === 2;
            const isLevel3 = day.level === 3;
            const isLevel4 = day.level === 4;

            return (
              <div
                key={day.date}
                onMouseEnter={() => setActiveHoverDay(day)}
                onMouseLeave={() => setActiveHoverDay(null)}
                className={`relative aspect-square rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none ${
                  day.isToday
                    ? "ring-2 ring-accent ring-offset-2 ring-offset-[#171a20] shadow-lg"
                    : ""
                } ${
                  day.isFuture
                    ? "neu-inset-soft border border-dashed border-white/[0.04] opacity-40 hover:opacity-75"
                    : isLevel4
                      ? "bg-[#dcc79a] text-[#17130c] shadow-md border border-[#f8ecd0]"
                      : isLevel3
                        ? "bg-[#8a6f35] text-white border border-[#dcc79a]/50 shadow-sm"
                        : isLevel2
                          ? "bg-[#614d25] text-accent-strong border border-[#8a6f35]/40"
                          : isLevel1
                            ? "bg-[#382d1c] text-accent border border-[#614d25]/30"
                            : "neu-inset-soft border border-white/[0.03] text-faint hover:text-muted"
                }`}
              >
                {/* Day Number */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-[11px] sm:text-xs font-semibold tabular-nums ${
                      isLevel4 ? "text-[#17130c]" : day.isToday ? "text-accent" : ""
                    }`}
                  >
                    {day.dayNum}
                  </span>

                  {day.isToday ? (
                    <span className="size-1.5 rounded-full bg-accent animate-ping" />
                  ) : null}
                </div>

                {/* Task Count / Status Indicator */}
                <div className="flex items-center justify-end w-full">
                  {day.completed > 0 ? (
                    <span
                      className={`inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold tabular-nums ${
                        isLevel4 ? "text-[#17130c]" : "text-accent"
                      }`}
                    >
                      <Check className="size-2.5" strokeWidth={3} />
                      <span>{day.completed}</span>
                    </span>
                  ) : day.isToday ? (
                    <span className="text-[8.5px] uppercase tracking-wider font-semibold text-accent/80">
                      Today
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hover Tooltip Overlay */}
        {activeHoverDay ? (
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#141820]/95 px-4 py-2.5 flex items-center justify-between text-xs animate-fade-in">
            <span className="font-medium text-ink">
              {activeHoverDay.fullDate}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-accent font-semibold">
                {activeHoverDay.completed} task{activeHoverDay.completed === 1 ? "" : "s"} completed
              </span>
              {activeHoverDay.earned > 0 ? (
                <span className="text-success font-medium">
                  +{formatCoins(activeHoverDay.earned)} coins
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* Website-Themed Legend & Readout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-faint pt-1">
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-accent" />
          <span>
            {monthData.activeDaysCount} active days in {monthData.monthName} ({monthData.totalCompletedTasks} total tasks)
          </span>
        </span>

        {/* Color Tiers Legend */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-[10px] uppercase tracking-wider mr-1">Tiers:</span>
          <span
            title="0 tasks"
            className="size-3.5 rounded-md border border-white/[0.04] bg-[#161a22]"
          />
          <span
            title="1 task"
            className="size-3.5 rounded-md border border-[#614d25]/30 bg-[#382d1c]"
          />
          <span
            title="2 tasks"
            className="size-3.5 rounded-md border border-[#8a6f35]/40 bg-[#614d25]"
          />
          <span
            title="3-4 tasks"
            className="size-3.5 rounded-md border border-[#dcc79a]/50 bg-[#8a6f35]"
          />
          <span
            title="5+ tasks"
            className="size-3.5 rounded-md border border-[#f8ecd0] bg-[#dcc79a]"
          />
          <span className="text-[10px] uppercase tracking-wider ml-1">5+ Tasks</span>
        </div>
      </div>
    </div>
  );
}

export function ConsistencyHeatmap(props) {
  return <GithubStreakHeatmap {...props} />;
}
