"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { POMODORO_CATEGORIES } from "./categories";
import type { PomodoroTask } from "@/hooks/usePomodoroTasks";
import { Clock } from "lucide-react";

interface TaskDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: PomodoroTask | null;
}

export function TaskDetailModal({
  open,
  onOpenChange,
  task,
}: TaskDetailModalProps) {
  if (!task) return null;
  const { label, icon: Icon } = POMODORO_CATEGORIES[task.category];
  const isDone = task.completedSessions >= task.totalSessions;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="sr-only">Detalhes da tarefa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg">{task.title}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  {isDone ? (
                    <>Concluída • {task.totalSessions}/{task.totalSessions} sessões</>
                  ) : (
                    <>Sessão {task.completedSessions}/{task.totalSessions}</>
                  )}
                </span>
                {task.completedAt ? (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(task.completedAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {task.notes ? (
            <div className="space-y-1.5">
              <h4 className="text-sm font-medium">Notas</h4>
              <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground max-h-32 overflow-y-auto whitespace-pre-wrap">
                {task.notes}
              </div>
            </div>
          ) : null}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              OK
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
