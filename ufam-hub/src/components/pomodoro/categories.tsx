"use client";

import {
  Briefcase,
  Gamepad2,
  UtensilsCrossed,
  BookOpen,
  Dumbbell,
  Folder,
  type LucideIcon,
} from "lucide-react";
import type { PomodoroTaskCategory } from "@/hooks/usePomodoroTasks";

export const POMODORO_CATEGORIES: Record<
  PomodoroTaskCategory,
  { label: string; icon: LucideIcon; color: string }
> = {
  work: { label: "Trabalho", icon: Briefcase, color: "text-amber-600" },
  play: { label: "Lazer", icon: Gamepad2, color: "text-slate-600" },
  food: { label: "Alimentação", icon: UtensilsCrossed, color: "text-amber-500" },
  learn: { label: "Estudo", icon: BookOpen, color: "text-emerald-600" },
  sport: { label: "Esporte", icon: Dumbbell, color: "text-violet-600" },
  other: { label: "Outros", icon: Folder, color: "text-zinc-500" },
};
