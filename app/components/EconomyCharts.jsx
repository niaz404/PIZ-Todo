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

function getGithubContributionColor(completed, isFuture) {
  if (isFuture) {
    return {
      bg: "bg-transparent",
      border: "border-dashed border-white/[0.06]",
      glow: "opacity-35",
    };
  }
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
      border: "border-[#dcc79a]/20",
      glow: "",
    };
  }
  if (completed <= 3) {
    return {
      bg: "bg-[#7c6436]",
      border: "border-[#dcc79a]/35",
      glow: "",
    };
  }
  if (completed <= 5) {
    return {
      bg: "bg-[#bfa260]",
      border: "border-[#dcc79a]/50",
      glow: "shadow-[0_0_8px_rgba(220,199,154,0.2)]",
    };
  }
  return {
    bg: "bg-[#ecd59f]",
    border: "border-white/40",
    glow: "shadow-[0_0_12px_rgba(220,199,154,0.45)]",
  };
}

export function GithubStreakHeatmap({ history = [], onMonthStats }) {
  const [activeHoverDay, setActiveHoverDay] = useState(null);

  const {
    weeks,
    monthName,
    year,
    monthStreak,
    totalTasks,
    activeDaysCount,
    completionRate,
  } = useMemo(() => {
    const list = Array.isArray(history) ? history : [];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentMonthName = today.toLocaleString("en-US", { month: "long" });
    const todayDateNum = today.getDate();

    // Map history entries by date string
    const historyMap = new Map();
    list.forEach((item) => {
      if (item && item.date) {
        historyMap.set(item.date, item);
      }
    });

    // Days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // First day of month: 0 = Sun, 1 = Mon ... convert to Mon = 0
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const leadingBlanks = (firstDayIndex + 6) % 7; // Monday = 0, Sunday = 6

    const flatDays = [];
    let totalCompleted = 0;
    let totalPossible = 0;
    let activeDays = 0;

    // 1. Add leading pad days
    for (let b = 0; b < leadingBlanks; b++) {
      flatDays.push({
        isPad: true,
        key: `pad-pre-${b}`,
      });
    }

    // 2. Add actual month days
    for (let d = 1; d <= daysInMonth; d++) {
      const yStr = String(currentYear);
      const mStr = String(currentMonth + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      const dateKey = `${yStr}-${mStr}-${dStr}`;

      const record = historyMap.get(dateKey);
      const completed = record?.completed ?? 0;
      const missed = record?.missed ?? 0;
      const earned = record?.earned ?? 0;
      const isToday = d === todayDateNum;
      const isFuture = d > todayDateNum;

      if (completed > 0) {
        totalCompleted += completed;
        activeDays += 1;
      }
      totalPossible += completed + missed;

      flatDays.push({
        isPad: false,
        key: dateKey,
        dayNum: d,
        date: dateKey,
        label: `${currentMonthName.slice(0, 3)} ${d}`,
        fullDate: `${currentMonthName} ${d}, ${currentYear}`,
        completed,
        missed,
        earned,
        isToday,
        isFuture,
      });
    }

    // 3. Add trailing pad days to complete the last 7-day column
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

    // 4. Group into 7-day columns (weeks)
    const weekCols = [];
    for (let i = 0; i < flatDays.length; i += 7) {
      weekCols.push(flatDays.slice(i, i + 7));
    }

    // 5. Calculate monthly consecutive streak
    let streakCount = 0;
    const todayRecord = list.find((d) => d.dayNum === todayDateNum);
    const todayHasDone = (todayRecord?.completed ?? 0) > 0;
    let checkDay = todayHasDone ? todayDateNum : todayDateNum - 1;

    while (checkDay >= 1) {
      const yStr = String(currentYear);
      const mStr = String(currentMonth + 1).padStart(2, "0");
      const dStr = String(checkDay).padStart(2, "0");
      const dateKey = `${yStr}-${mStr}-${dStr}`;
      const rec = historyMap.get(dateKey);
      if (rec && rec.completed > 0) {
        streakCount += 1;
        checkDay -= 1;
      } else {
        break;
      }
    }

    const rate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    return {
      weeks: weekCols,
      monthName: currentMonthName,
      year: currentYear,
      monthStreak: streakCount,
      totalTasks: totalCompleted,
      activeDaysCount: activeDays,
      completionRate: rate,
    };
  }, [history]);

  useEffect(() => {
    onMonthStats?.({
      streak: monthStreak,
      tasks: totalTasks,
      monthName,
      activeDays: activeDaysCount,
    });
  }, [monthStreak, totalTasks, monthName, activeDaysCount, onMonthStats]);

  const weekDayLabels = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

  return (
    <div className="w-full space-y-6">
      {/* 4 Monthly KPI Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="neu-inset-soft rounded-2xl p-4">
          <div className="flex items-center justify-between text-faint">
            <span className="text-[9px] uppercase tracking-[0.16em]">Month Streak</span>
            <Flame className="size-4 text-accent" />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
            {monthStreak} <span className="text-xs font-normal text-muted">days</span>
          </p>
          <p className="mt-1 text-[10px] text-faint">Consecutive in {monthName}</p>
        </div>

        <div className="neu-inset-soft rounded-2xl p-4">
          <div className="flex items-center justify-between text-faint">
            <span className="text-[9px] uppercase tracking-[0.16em]">Tasks Done</span>
            <Check className="size-4 text-success" />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
            {totalTasks} <span className="text-xs font-normal text-muted">tasks</span>
          </p>
          <p className="mt-1 text-[10px] text-faint">Finished in {monthName}</p>
        </div>

        <div className="neu-inset-soft rounded-2xl p-4">
          <div className="flex items-center justify-between text-faint">
            <span className="text-[9px] uppercase tracking-[0.16em]">Active Days</span>
            <Zap className="size-4 text-accent" />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
            {activeDaysCount} <span className="text-xs font-normal text-muted">days</span>
          </p>
          <p className="mt-1 text-[10px] text-faint">Days with completed tasks</p>
        </div>

        <div className="neu-inset-soft rounded-2xl p-4">
          <div className="flex items-center justify-between text-faint">
            <span className="text-[9px] uppercase tracking-[0.16em]">Consistency</span>
            <TrendingUp className="size-4 text-accent" />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
            {completionRate}%
          </p>
          <p className="mt-1 text-[10px] text-faint">Monthly completion rate</p>
        </div>
      </div>

      {/* GitHub Calendar Grid Card */}
      <div className="relative rounded-[24px] border border-white/[0.05] bg-white/[0.015] p-5 sm:p-6 overflow-x-auto">
        {/* Month Title Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-faint">
              Contribution Heatmap · {year}
            </p>
            <h3 className="font-display text-lg text-ink font-normal mt-0.5">
              {monthName} <span className="italic text-accent">Activity Matrix</span>
            </h3>
          </div>
          <span className="text-xs text-muted tabular-nums">
            {weeks.length} weeks tracked
          </span>
        </div>

        {/* Matrix Area: Labels on left, week columns */}
        <div className="flex items-start gap-3 min-w-[340px]">
          {/* Weekday labels */}
          <div className="flex flex-col justify-between py-1 text-[10px] text-faint/70 pr-1 select-none">
            {weekDayLabels.map((lbl, idx) => (
              <span key={idx} className="h-6 sm:h-7 flex items-center">
                {lbl}
              </span>
            ))}
          </div>

          {/* Week columns */}
          <div className="flex gap-2 sm:gap-2.5">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-2 sm:gap-2.5">
                {week.map((day) => {
                  if (day.isPad) {
                    return (
                      <div
                        key={day.key}
                        className="size-6 sm:size-7 rounded-[4px] opacity-0 pointer-events-none"
                      />
                    );
                  }

                  const style = getGithubContributionColor(day.completed, day.isFuture);

                  return (
                    <div
                      key={day.key}
                      onMouseEnter={() => setActiveHoverDay(day)}
                      onMouseLeave={() => setActiveHoverDay(null)}
                      title={`${day.label}: ${day.completed || 0} completed${
                        day.earned ? ` · +${formatCoins(day.earned)} coins` : ""
                      }`}
                      className={`relative size-6 sm:size-7 rounded-[4px] border transition-transform duration-150 hover:scale-110 cursor-pointer select-none ${style.bg} ${style.border} ${style.glow} ${
                        day.isToday
                          ? "ring-2 ring-accent ring-offset-2 ring-offset-[#171a20]"
                          : ""
                      }`}
                    >
                      {/* Day number label inside cell for clarity */}
                      <span
                        className={`absolute inset-0 grid place-items-center text-[9px] font-semibold tabular-nums pointer-events-none ${
                          day.completed >= 5
                            ? "text-[#17130c]"
                            : day.completed > 0
                              ? "text-white/90"
                              : "text-faint/60"
                        }`}
                      >
                        {day.dayNum}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Live Hover Info Side Box */}
          <div className="ml-auto hidden md:flex flex-col justify-center rounded-2xl neu-inset-soft p-4 min-w-[200px]">
            {activeHoverDay ? (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-faint">
                  {activeHoverDay.fullDate}
                </p>
                <p className="text-sm font-semibold text-ink">
                  {activeHoverDay.completed} task{activeHoverDay.completed === 1 ? "" : "s"} done
                </p>
                {activeHoverDay.earned > 0 && (
                  <p className="text-xs text-accent font-medium">
                    +{formatCoins(activeHoverDay.earned)} coins earned
                  </p>
                )}
                {activeHoverDay.isToday && (
                  <span className="inline-block rounded-md bg-accent/20 px-2 py-0.5 text-[9px] font-bold text-accent uppercase tracking-wider">
                    Today
                  </span>
                )}
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-xs text-muted">Hover any day</p>
                <p className="text-[10px] text-faint mt-0.5">Inspect task completion & earnings</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile hover banner */}
        {activeHoverDay && (
          <div className="mt-3 md:hidden rounded-xl border border-white/[0.06] bg-[#141820]/95 px-3 py-2 text-xs flex items-center justify-between">
            <span className="text-ink font-medium">{activeHoverDay.fullDate}</span>
            <span className="text-accent font-semibold">{activeHoverDay.completed} tasks</span>
          </div>
        )}
      </div>

      {/* Website-Themed Legend & Readout */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05] pt-3 text-[10px] text-faint">
        <span>{totalTasks} total contributions in {monthName}</span>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <span
            title="0 tasks"
            className="size-3.5 rounded-[3px] border border-white/[0.04] bg-[#161a22]"
          />
          <span
            title="1 task"
            className="size-3.5 rounded-[3px] border border-accent/20 bg-[#423724]"
          />
          <span
            title="2-3 tasks"
            className="size-3.5 rounded-[3px] border border-accent/35 bg-[#7c6436]"
          />
          <span
            title="4-5 tasks"
            className="size-3.5 rounded-[3px] border border-accent/50 bg-[#bfa260]"
          />
          <span
            title="6+ tasks"
            className="size-3.5 rounded-[3px] border border-white/40 bg-[#ecd59f]"
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
