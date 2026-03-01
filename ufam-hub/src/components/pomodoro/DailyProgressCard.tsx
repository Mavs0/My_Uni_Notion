"use client";

import { cn } from "@/lib/utils";

interface DailyProgressCardProps {
  doneCount: number;
  totalCount: number;
  className?: string;
}

export function DailyProgressCard({
  doneCount,
  totalCount,
  className,
}: DailyProgressCardProps) {
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card/80 backdrop-blur-xl shadow-lg p-4",
        className
      )}
    >
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Progresso diário
      </h3>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-bold">
            <span className="text-primary">{doneCount}</span>
            <span className="text-muted-foreground font-normal">
              /{totalCount} tarefas concluídas
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {dateStr} – {timeStr}
          </p>
        </div>
        <div className="relative h-12 w-12 flex items-center justify-center">
          <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-muted/30"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-primary"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${pct}, 100`}
              fill="none"
              strokeLinecap="round"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="absolute text-[10px] font-semibold text-foreground">
            {pct}%
          </span>
        </div>
      </div>
    </div>
  );
}
