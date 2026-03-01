"use client";

import { useState, useCallback, useEffect } from "react";

export type PomodoroTaskCategory =
  | "work"
  | "play"
  | "food"
  | "learn"
  | "sport"
  | "other";

export interface PomodoroTask {
  id: string;
  title: string;
  category: PomodoroTaskCategory;
  totalSessions: number;
  completedSessions: number;
  notes: string;
  disciplinaId: string | null;
  createdAt: string;
  completedAt: string | null;
  disabled: boolean;
}

const STORAGE_KEY = "pomodoro-tasks";

const defaultTasks: PomodoroTask[] = [];

function loadTasks(): PomodoroTask[] {
  if (typeof window === "undefined") return defaultTasks;
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return defaultTasks;
}

function saveTasks(tasks: PomodoroTask[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {}
}

export function usePomodoroTasks() {
  const [tasks, setTasks] = useState<PomodoroTask[]>(defaultTasks);

  useEffect(() => {
    setTasks(loadTasks());
  }, []);

  const persist = useCallback((next: PomodoroTask[]) => {
    setTasks(next);
    saveTasks(next);
  }, []);

  const addTask = useCallback(
    (task: Omit<PomodoroTask, "id" | "createdAt" | "completedAt" | "completedSessions" | "disabled">) => {
      const newTask: PomodoroTask = {
        ...task,
        id: crypto.randomUUID(),
        completedSessions: 0,
        createdAt: new Date().toISOString(),
        completedAt: null,
        disabled: false,
      };
      persist([...tasks, newTask]);
      return newTask.id;
    },
    [tasks, persist]
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<PomodoroTask>) => {
      persist(
        tasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
    },
    [tasks, persist]
  );

  const deleteTask = useCallback(
    (id: string) => {
      persist(tasks.filter((t) => t.id !== id));
    },
    [tasks, persist]
  );

  const completeSession = useCallback(
    (taskId: string) => {
      const t = tasks.find((x) => x.id === taskId);
      if (!t) return;
      const next = t.completedSessions + 1;
      const completedAt = next >= t.totalSessions ? new Date().toISOString() : null;
      updateTask(taskId, { completedSessions: next, completedAt });
    },
    [tasks, updateTask]
  );

  const tasksDoneToday = tasks.filter((t) => {
    if (t.completedSessions < t.totalSessions) return false;
    if (!t.completedAt) return false;
    const d = new Date(t.completedAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  const totalTasks = tasks.filter((t) => !t.disabled).length;
  const doneCount = tasks.filter(
    (t) => !t.disabled && t.completedSessions >= t.totalSessions
  ).length;

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    completeSession,
    tasksDoneToday,
    totalTasks,
    doneCount,
  };
}
