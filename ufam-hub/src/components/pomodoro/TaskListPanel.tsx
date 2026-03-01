"use client";

import * as React from "react";
import { Search, MoreVertical, FileText, Plus, Eye, Pencil, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { POMODORO_CATEGORIES } from "./categories";
import { AddTaskModal } from "./AddTaskModal";
import { TaskDetailModal } from "./TaskDetailModal";
import type { PomodoroTask } from "@/hooks/usePomodoroTasks";
import { cn } from "@/lib/utils";

interface TaskListPanelProps {
  tasks: PomodoroTask[];
  currentTaskId: string | null;
  onAddTask: (task: Parameters<React.ComponentProps<typeof AddTaskModal>["onAdd"]>[0]) => void;
  onUpdateTask: (id: string, updates: Partial<PomodoroTask>) => void;
  onDeleteTask: (id: string) => void;
  onSelectTask: (id: string | null) => void;
}

export function TaskListPanel({
  tasks,
  currentTaskId,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onSelectTask,
}: TaskListPanelProps) {
  const [addOpen, setAddOpen] = React.useState(false);
  const [detailTask, setDetailTask] = React.useState<PomodoroTask | null>(null);
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!search.trim()) return tasks.filter((t) => !t.disabled);
    const q = search.toLowerCase();
    return tasks.filter(
      (t) => !t.disabled && t.title.toLowerCase().includes(q)
    );
  }, [tasks, search]);

  const handleAdd = React.useCallback(
    (data: Parameters<React.ComponentProps<typeof AddTaskModal>["onAdd"]>[0]) => {
      onAddTask({
        title: data.title,
        category: data.category,
        totalSessions: data.totalSessions,
        notes: data.notes,
        disciplinaId: data.disciplinaId,
      });
    },
    [onAddTask]
  );

  return (
    <>
      <div className="flex h-full flex-col rounded-2xl border bg-card/80 backdrop-blur-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <h2 className="font-semibold text-lg">
            Lista de Tarefas
            {tasks.length > 0 ? (
              <span className="text-muted-foreground font-normal ml-1.5">
                ({tasks.filter((t) => !t.disabled).length} tarefas)
              </span>
            ) : null}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-lg p-2 hover:bg-muted"
              aria-label="Buscar"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              type="button"
              className="rounded-lg p-2 hover:bg-muted"
              aria-label="Mais opções"
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="rounded-2xl bg-muted/50 p-6 mb-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground">Nenhuma tarefa</p>
              <p className="text-sm text-muted-foreground mt-1">
                Adicione tarefas à lista para acompanhar seu progresso.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((task) => {
                const isDone = task.completedSessions >= task.totalSessions;
                const isCurrent = currentTaskId === task.id;
                const { icon: Icon, color } = POMODORO_CATEGORIES[task.category];
                return (
                  <li
                    key={task.id}
                    className={cn(
                      "group flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer",
                      isCurrent && "bg-primary/5"
                    )}
                    onClick={() => onSelectTask(task.id)}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        isDone ? "bg-emerald-500/20 text-emerald-600" : "bg-muted",
                        !isDone && color
                      )}
                    >
                      {isDone ? (
                        <span className="text-emerald-600 font-bold text-sm">✓</span>
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {isDone
                          ? "Concluída"
                          : `Sessão ${task.completedSessions}/${task.totalSessions}`}
                        {task.completedAt
                          ? ` • ${new Date(task.completedAt).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                          : ""}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDetailTask(task); }}>
                          <Eye className="h-4 w-4" />
                          Detalhes da tarefa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateTask(task.id, { disabled: !task.disabled });
                          }}
                        >
                          <EyeOff className="h-4 w-4" />
                          {task.disabled ? "Reativar tarefa" : "Desativar tarefa"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTask(task.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir tarefa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t p-3">
          <Button
            onClick={() => setAddOpen(true)}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-11"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Tarefa
          </Button>
        </div>
      </div>

      <AddTaskModal open={addOpen} onOpenChange={setAddOpen} onAdd={handleAdd} />
      <TaskDetailModal
        open={!!detailTask}
        onOpenChange={(open) => !open && setDetailTask(null)}
        task={detailTask}
      />
    </>
  );
}
