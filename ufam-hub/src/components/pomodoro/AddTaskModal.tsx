"use client";

import * as React from "react";
import { X, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { POMODORO_CATEGORIES } from "./categories";
import type { PomodoroTaskCategory } from "@/hooks/usePomodoroTasks";
import { cn } from "@/lib/utils";

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (task: {
    title: string;
    category: PomodoroTaskCategory;
    totalSessions: number;
    notes: string;
    disciplinaId: string | null;
  }) => void;
}

export function AddTaskModal({
  open,
  onOpenChange,
  onAdd,
}: AddTaskModalProps) {
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<PomodoroTaskCategory>("learn");
  const [totalSessions, setTotalSessions] = React.useState(2);
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      setError("O título não pode ficar vazio.");
      return;
    }
    setError("");
    onAdd({
      title: t,
      category,
      totalSessions,
      notes: notes.trim(),
      disciplinaId: null,
    });
    setTitle("");
    setCategory("learn");
    setTotalSessions(2);
    setNotes("");
    onOpenChange(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) setError("");
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-lg">Adicionar Tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-3">
            <Label htmlFor="task-title" className="block">Título da tarefa</Label>
            <Input
              id="task-title"
              placeholder="Digite o título do que você vai fazer..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError("");
              }}
              className={cn(error && "border-destructive")}
            />
            {error ? (
              <p className="text-sm text-destructive flex items-center gap-1 mt-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <Label className="block">Selecionar categoria</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(POMODORO_CATEGORIES) as PomodoroTaskCategory[]).map(
                (key) => {
                  const { label, icon: Icon } = POMODORO_CATEGORIES[key];
                  const selected = category === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCategory(key)}
                      className={cn(
                        "relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-3 min-w-[72px] transition-all",
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/50 hover:bg-muted text-muted-foreground"
                      )}
                    >
                      {selected ? (
                        <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-[10px] text-primary-foreground">✓</span>
                        </span>
                      ) : null}
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="block">Total de sessões</Label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setTotalSessions((n) => Math.max(1, n - 1))
                }
                className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted text-lg font-medium hover:bg-muted/80"
              >
                −
              </button>
              <span className="text-2xl font-semibold tabular-nums min-w-[2ch] text-center">
                {totalSessions}
              </span>
              <button
                type="button"
                onClick={() =>
                  setTotalSessions((n) => Math.min(20, n + 1))
                }
                className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted text-lg font-medium hover:bg-muted/80"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="task-notes" className="block">Notas</Label>
              <button
                type="button"
                onClick={() => setNotes("")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5 inline" /> Limpar
              </button>
            </div>
            <Textarea
              id="task-notes"
              placeholder="Descreva a tarefa ou adicione anotações..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => handleClose(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              Adicionar Tarefa
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
