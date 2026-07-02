"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface MatchScoreRingProps {
  score: number;
  size?: number;
  className?: string;
}

/**
 * MatchScoreRing — animated SVG ring showing match percentage.
 *
 * Color semantics:
 * ≥70%  → emerald  (strong match — apply now)
 * 50–69%→ amber    (moderate — close the gap with tailoring)
 * <50%  → rose     (weak — significant upskilling needed)
 *
 * Animates on mount from 0 to the target score.
 * Pure SVG — no external charting library needed.
 */
export function MatchScoreRing({ score, size = 140, className }: MatchScoreRingProps) {
  const t = useTranslations("jobAnalyzer");
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animated / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;

  const color =
    score >= 70 ? "#10B981" :
    score >= 50 ? "#C2782A" :
    "#F43F5E";

  const label =
    score >= 70 ? t("matchScore.strongMatch") :
    score >= 50 ? t("matchScore.moderateMatch") :
    t("matchScore.weakMatch");

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: "rotate(-90deg)" }}
          aria-label={t("matchScore.ariaLabel", { score })}
        >
          {/* Background track */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={10}
            className="text-muted/30"
          />
          {/* Progress arc */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        </svg>

        {/* Center text */}
        <div
          style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <span style={{ fontSize: size * 0.2, fontWeight: 700, color, lineHeight: 1, fontFamily: "monospace" }}>
            {score}%
          </span>
          <span style={{ fontSize: size * 0.08, color: "#9B8F87", marginTop: 2, letterSpacing: "0.02em" }}>
            {t("matchScore.match")}
          </span>
        </div>
      </div>

      <span className="text-xs font-medium" style={{ color }}>{label}</span>
    </div>
  );
}
