"use client";

import { Trophy, Loader2 } from "lucide-react";

export interface MatchScoreboardProps {
  hostName: string;
  guestName: string;
  score: { host: number; guest: number };
  minute: number | null;
  isSimulating?: boolean;
  shootoutScore?: { host: number; guest: number } | null;
}

const MINUTE_LABEL: Record<string, string> = {
  "0": "KICK OFF",
  "45": "HT",
  "90": "FT",
};

function minuteLabel(minute: number | null): string {
  if (minute === null) return "–";
  return MINUTE_LABEL[String(minute)] ?? `${minute}'`;
}

export function MatchScoreboard({
  hostName,
  guestName,
  score,
  minute,
  isSimulating = false,
  shootoutScore,
}: MatchScoreboardProps) {
  const winner =
    score.host !== score.guest
      ? score.host > score.guest
        ? "host"
        : "guest"
      : shootoutScore && shootoutScore.host !== shootoutScore.guest
        ? shootoutScore.host > shootoutScore.guest
          ? "host"
          : "guest"
        : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/95 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
      <div className="pointer-events-none absolute inset-x-0 -top-16 h-32 bg-lime/8 blur-3xl" />

      <div className="relative flex items-center justify-between gap-3">
        {/* HOST */}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <span
            className={`truncate text-[10px] font-black uppercase tracking-widest sm:text-xs ${
              winner === "host" ? "text-lime" : "text-steel"
            }`}
          >
            {hostName}
          </span>
          <span
            className={`font-stats text-3xl leading-none sm:text-4xl ${
              winner === "host" ? "text-lime" : "text-white/90"
            }`}
          >
            {score.host}
          </span>
          {winner === "host" && !isSimulating && (
            <span className="flex items-center gap-1 rounded-full border border-lime/30 bg-lime/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-lime">
              <Trophy className="h-2.5 w-2.5" /> WINNER
            </span>
          )}
        </div>

        {/* CENTER: minute + separator */}
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <span
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest sm:text-[10px] ${
              isSimulating
                ? "border-lime/40 bg-lime/10 text-lime"
                : "border-white/10 bg-slate-950 text-steel"
            }`}
          >
            {isSimulating && <Loader2 className="h-3 w-3 animate-spin" />}
            {minuteLabel(minute)}
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-steel/50">Full Time</span>
        </div>

        {/* GUEST */}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <span
            className={`truncate text-[10px] font-black uppercase tracking-widest sm:text-xs ${
              winner === "guest" ? "text-rose-400" : "text-steel"
            }`}
          >
            {guestName}
          </span>
          <span
            className={`font-stats text-3xl leading-none sm:text-4xl ${
              winner === "guest" ? "text-rose-400" : "text-white/90"
            }`}
          >
            {score.guest}
          </span>
          {winner === "guest" && !isSimulating && (
            <span className="flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-rose-400">
              <Trophy className="h-2.5 w-2.5" /> WINNER
            </span>
          )}
        </div>
      </div>

      {shootoutScore && (
        <div className="relative mt-2.5 flex justify-center">
          <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-0.5 text-[8px] font-black uppercase tracking-widest text-amber-300">
            Penalties {shootoutScore.host} - {shootoutScore.guest}
          </span>
        </div>
      )}
    </div>
  );
}
