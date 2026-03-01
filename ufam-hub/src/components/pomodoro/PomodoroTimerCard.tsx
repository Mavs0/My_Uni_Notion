"use client";

import * as React from "react";
import {
  Play,
  Square,
  RotateCcw,
  Clock,
  Coffee,
  Settings,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePomodoro } from "@/contexts/PomodoroContext";
import { POMODORO_CATEGORIES } from "./categories";
import type { PomodoroTask } from "@/hooks/usePomodoroTasks";
import { cn } from "@/lib/utils";

interface PomodoroTimerCardProps {
  currentTask: PomodoroTask | null;
  onSessionComplete?: (taskId: string) => void;
}

const BREAK_TIPS = [
  "Fazer alongamentos simples",
  "Beber água",
  "Olhar pela janela",
  "Caminhar um pouco",
];

export function PomodoroTimerCard({
  currentTask,
  onSessionComplete,
}: PomodoroTimerCardProps) {
  const pomodoro = usePomodoro();
  const {
    timeLeft,
    isRunning,
    phase,
    settings,
    setSettings,
    toggleTimer,
    resetTimer,
    switchToStudy,
    switchToBreak,
    getProgress,
    getPhaseLabel,
    formatTime,
  } = pomodoro;

  const isStudy = phase === "study";
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [breakTip] = React.useState(
    () => BREAK_TIPS[Math.floor(Math.random() * BREAK_TIPS.length)]
  );
  const prevPhaseRef = React.useRef(phase);

  React.useEffect(() => {
    if (prevPhaseRef.current === "study" && phase !== "study" && currentTask && onSessionComplete) {
      onSessionComplete(currentTask.id);
    }
    prevPhaseRef.current = phase;
  }, [phase, currentTask, onSessionComplete]);

  const currentTaskLabel = currentTask
    ? `#${(currentTask.completedSessions || 0) + 1} – ${currentTask.title}`
    : "Hora de focar";

  const taskIcon = currentTask
    ? POMODORO_CATEGORIES[currentTask.category].icon
    : Clock;
  const TaskIcon = taskIcon;

  return (
    <div className="rounded-2xl border bg-card/80 backdrop-blur-xl shadow-lg overflow-hidden flex flex-col">
      {/* Toggle Ongoing / Break */}
      <div className="flex border-b bg-muted/30">
        <button
          type="button"
          onClick={switchToStudy}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
            isStudy
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Clock className="h-4 w-4" />
          Em andamento
        </button>
        <button
          type="button"
          onClick={switchToBreak}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
            !isStudy
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Coffee className="h-4 w-4" />
          Pausa
        </button>
      </div>

      <div className="p-6 flex flex-col items-center flex-1">
        <div className="text-5xl md:text-6xl font-bold tabular-nums tracking-tight text-foreground mb-1">
          {formatTime(timeLeft)}
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {isStudy ? getPhaseLabel() : "Hora de descansar"}
        </p>
        <Progress value={getProgress()} className="w-full h-2 mb-6" />

        {!isStudy && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Info className="h-4 w-4 text-primary" />
            {breakTip}
          </p>
        )}

        <div className="flex items-center gap-2 w-full rounded-xl bg-muted/50 px-3 py-2.5 mb-6">
          <TaskIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium truncate">{currentTaskLabel}</span>
        </div>

        <div className="flex items-center gap-3 w-full justify-center">
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-xl"
            onClick={resetTimer}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            onClick={toggleTimer}
            className={cn(
              "h-12 px-8 rounded-xl font-medium",
              isRunning
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-emerald-600 hover:bg-emerald-700"
            )}
          >
            {isRunning ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Parar
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Iniciar
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex justify-end p-2 border-t">
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Configurações do Pomodoro</DialogTitle>
              <DialogDescription>
                Ajuste os tempos e preferências do timer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Estudo (min)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={Math.floor(settings.studyTime / 60)}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v) && v >= 1 && v <= 60)
                        setSettings((s) => ({ ...s, studyTime: v * 60 }));
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Pausa curta (min)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={Math.floor(settings.breakTime / 60)}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v) && v >= 1 && v <= 30)
                        setSettings((s) => ({ ...s, breakTime: v * 60 }));
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Pausa longa (min)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={Math.floor(settings.longBreakTime / 60)}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v) && v >= 1 && v <= 60)
                        setSettings((s) => ({ ...s, longBreakTime: v * 60 }));
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Pausa longa a cada</Label>
                  <Input
                    type="number"
                    min={2}
                    max={10}
                    value={settings.longBreakInterval}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v) && v >= 2 && v <= 10)
                        setSettings((s) => ({ ...s, longBreakInterval: v }));
                    }}
                  />
                  <p className="text-xs text-muted-foreground">pomodoros</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="font-medium">Notificações</Label>
                  <p className="text-xs text-muted-foreground">
                    Avisar quando o timer completar
                  </p>
                </div>
                <Switch
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) =>
                    setSettings((s) => ({ ...s, enableNotifications: checked }))
                  }
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
