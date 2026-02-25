"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Play, Pause, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePomodoroOptional } from "@/contexts/PomodoroContext";
import { cn } from "@/lib/utils";

export function PomodoroFloatingWidget() {
  const pathname = usePathname();
  const pomodoro = usePomodoroOptional();

  if (!pomodoro || pathname === "/pomodoro") return null;
  if (!pomodoro.hasActiveSession) return null;

  const { timeLeft, isRunning, phase, formatTime, getPhaseLabel, getPhaseColor, toggleTimer } = pomodoro;

  return (
    <Link
      href="/pomodoro"
      className={cn(
        "fixed top-4 right-4 z-40 flex items-center gap-2 rounded-lg border bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm transition-all hover:bg-accent/50",
        "ring-1 ring-border/50"
      )}
    >
      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className={cn("text-lg font-mono font-semibold tabular-nums", getPhaseColor())}>
        {formatTime(timeLeft)}
      </span>
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {getPhaseLabel()}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleTimer();
        }}
      >
        {isRunning ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
      </Button>
    </Link>
  );
}
