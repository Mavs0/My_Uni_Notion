"use client";
import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Coffee,
  Volume2,
  VolumeX,
  Settings,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useDisciplinas } from "@/hooks/useDisciplinas";
import { usePomodoro } from "@/contexts/PomodoroContext";

type PomodoroPhase = "study" | "break" | "longBreak";

const DEFAULT_STUDY_TIME = 25 * 60; // 25 minutos em segundos
const DEFAULT_BREAK_TIME = 5 * 60; // 5 minutos em segundos
const DEFAULT_LONG_BREAK_TIME = 15 * 60; // 15 minutos em segundos

const AMBIENT_SOUNDS = [
  { id: "none", name: "Sem som", icon: VolumeX },
  { id: "rain", name: "Chuva", url: null },
  { id: "cafe", name: "Cafeteria", url: null },
  { id: "street", name: "Rua", url: null },
  { id: "forest", name: "Floresta", url: null },
  { id: "ocean", name: "Oceano", url: null },
  { id: "white-noise", name: "Ruído Branco", url: null },
] as const;

type AmbientSoundId = (typeof AMBIENT_SOUNDS)[number]["id"];

interface PomodoroSettings {
  studyTime: number;
  breakTime: number;
  longBreakTime: number;
  enableNotifications: boolean;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  longBreakInterval: number;
}

export function PomodoroTimer() {
  const { disciplinasAtivas } = useDisciplinas();
  const pomodoro = usePomodoro();
  const {
    timeLeft,
    isRunning,
    phase,
    settings,
    setSettings,
    completedPomodoros,
    toggleTimer,
    resetTimer,
    getProgress,
    getPhaseLabel,
    getPhaseColor,
    formatTime,
    registerSessionInfo,
  } = pomodoro;

  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<string>("");
  const [ambientSound, setAmbientSound] = useState<AmbientSoundId>("none");
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const whiteNoiseNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (disciplinasAtivas.length > 0) {
      const firstId = disciplinasAtivas[0].id;
      if (!selectedDisciplinaId || !disciplinasAtivas.some((d) => d.id === selectedDisciplinaId)) {
        setSelectedDisciplinaId(firstId);
      }
    } else {
      setSelectedDisciplinaId("");
    }
  }, [disciplinasAtivas]);

  useEffect(() => {
    registerSessionInfo({
      disciplinas: disciplinasAtivas,
      selectedDisciplinaId,
    });
  }, [disciplinasAtivas, selectedDisciplinaId, registerSessionInfo]);

  const generateWhiteNoise = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;
    const bufferSize = 4096;
    const buffer = audioContext.createBuffer(
      1,
      bufferSize,
      audioContext.sampleRate
    );
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = audioContext.createBufferSource();
    whiteNoise.buffer = buffer;
    whiteNoise.loop = true;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.1;

    whiteNoise.connect(gainNode);
    gainNode.connect(audioContext.destination);

    whiteNoise.start();
    whiteNoiseNodeRef.current = whiteNoise;

    return () => {
      if (whiteNoiseNodeRef.current) {
        whiteNoiseNodeRef.current.stop();
        whiteNoiseNodeRef.current.disconnect();
        whiteNoiseNodeRef.current = null;
      }
    };
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (whiteNoiseNodeRef.current) {
      whiteNoiseNodeRef.current.stop();
      whiteNoiseNodeRef.current.disconnect();
      whiteNoiseNodeRef.current = null;
    }

    if (ambientSound === "none" || !isAmbientPlaying) {
      setIsAmbientPlaying(false);
      return;
    }

    const soundConfig = AMBIENT_SOUNDS.find((s) => s.id === ambientSound);
    if (!soundConfig) return;

    if (ambientSound === "white-noise") {
      const cleanup = generateWhiteNoise();
      setIsAmbientPlaying(true);
      return cleanup;
    } else if ("url" in soundConfig && soundConfig.url) {
      const audio = new Audio(soundConfig.url);
      audio.loop = true;
      audio.volume = 0.3;

      audio.addEventListener("error", () => {
        setIsAmbientPlaying(false);
      });

      audio.play().catch(() => {
        setIsAmbientPlaying(false);
      });

      audioRef.current = audio;
      setIsAmbientPlaying(true);

      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    }
  }, [ambientSound, isAmbientPlaying]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (whiteNoiseNodeRef.current) {
        whiteNoiseNodeRef.current.stop();
        whiteNoiseNodeRef.current.disconnect();
        whiteNoiseNodeRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  const getPhaseBgColor = () => {
    if (phase === "study") return "bg-primary/10 border-primary/20";
    if (phase === "break") return "bg-blue-500/10 border-blue-500/20";
    return "bg-purple-500/10 border-purple-500/20";
  };

  const getPhaseIcon = () => {
    if (phase === "study") return <CheckCircle2 className="h-6 w-6" />;
    return <Coffee className="h-6 w-6" />;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Card Principal */}
      <Card className={`transition-all duration-300 ${getPhaseBgColor()}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getPhaseBgColor()}`}>
                {getPhaseIcon()}
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Pomodoro Timer
                  <Badge variant="outline" className="ml-2">
                    {completedPomodoros} {completedPomodoros === 1 ? "pomodoro" : "pomodoros"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {getPhaseLabel()} • {formatTime(timeLeft)} restantes
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-lg">Configurações do Pomodoro</DialogTitle>
                    <DialogDescription>
                      Ajuste os tempos e preferências do timer
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-2">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-foreground">Tempos</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="studyTime" className="text-sm">Estudo (min)</Label>
                          <Input
                            id="studyTime"
                            type="number"
                            min={1}
                            max={60}
                            value={Math.floor(settings.studyTime / 60)}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              if (!isNaN(v) && v >= 1 && v <= 60) {
                                setSettings((s) => ({ ...s, studyTime: v * 60 }));
                              }
                            }}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="breakTime" className="text-sm">Pausa curta (min)</Label>
                          <Input
                            id="breakTime"
                            type="number"
                            min={1}
                            max={30}
                            value={Math.floor(settings.breakTime / 60)}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              if (!isNaN(v) && v >= 1 && v <= 30) {
                                setSettings((s) => ({ ...s, breakTime: v * 60 }));
                              }
                            }}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="longBreakTime" className="text-sm">Pausa longa (min)</Label>
                          <Input
                            id="longBreakTime"
                            type="number"
                            min={1}
                            max={60}
                            value={Math.floor(settings.longBreakTime / 60)}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              if (!isNaN(v) && v >= 1 && v <= 60) {
                                setSettings((s) => ({ ...s, longBreakTime: v * 60 }));
                              }
                            }}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="longBreakInterval" className="text-sm">Pausa longa a cada</Label>
                          <Input
                            id="longBreakInterval"
                            type="number"
                            min={2}
                            max={10}
                            value={settings.longBreakInterval}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              if (!isNaN(v) && v >= 2 && v <= 10) {
                                setSettings((s) => ({ ...s, longBreakInterval: v }));
                              }
                            }}
                            className="h-9"
                          />
                          <p className="text-xs text-muted-foreground">pomodoros</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 border-t">
                      <h4 className="text-sm font-medium text-foreground">Preferências</h4>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                          <div className="flex-1 min-w-0">
                            <Label htmlFor="notifications" className="text-sm font-medium cursor-pointer">Notificações</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">Avisar quando o timer completar</p>
                          </div>
                          <Switch
                            id="notifications"
                            checked={settings.enableNotifications}
                            onCheckedChange={(checked) =>
                              setSettings((s) => ({ ...s, enableNotifications: checked }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                          <div className="flex-1 min-w-0">
                            <Label htmlFor="autoStartBreaks" className="text-sm font-medium cursor-pointer">Iniciar pausas</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">Começar pausa automaticamente</p>
                          </div>
                          <Switch
                            id="autoStartBreaks"
                            checked={settings.autoStartBreaks}
                            onCheckedChange={(checked) =>
                              setSettings((s) => ({ ...s, autoStartBreaks: checked }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                          <div className="flex-1 min-w-0">
                            <Label htmlFor="autoStartPomodoros" className="text-sm font-medium cursor-pointer">Iniciar pomodoros</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">Começar próximo ciclo após pausa</p>
                          </div>
                          <Switch
                            id="autoStartPomodoros"
                            checked={settings.autoStartPomodoros}
                            onCheckedChange={(checked) =>
                              setSettings((s) => ({ ...s, autoStartPomodoros: checked }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seletor de Disciplina */}
          <div className="space-y-2">
            <Label>Disciplina</Label>
            <Select
              value={selectedDisciplinaId || undefined}
              onValueChange={setSelectedDisciplinaId}
              disabled={isRunning}
            >
              <SelectTrigger>
                <SelectValue placeholder={disciplinasAtivas.length === 0 ? "Nenhuma disciplina" : "Selecione uma disciplina"} />
              </SelectTrigger>
              <SelectContent className="z-[100] max-h-[var(--radix-select-content-available-height)]">
                {disciplinasAtivas.map((disc) => (
                  <SelectItem key={disc.id} value={disc.id}>
                    {disc.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seletor de Som Ambiente */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Som Ambiente</Label>
              {ambientSound !== "none" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAmbientPlaying(!isAmbientPlaying)}
                >
                  {isAmbientPlaying ? (
                    <>
                      <Volume2 className="h-4 w-4 mr-2" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-4 w-4 mr-2" />
                      Tocar
                    </>
                  )}
                </Button>
              )}
            </div>
            <Select
              value={ambientSound}
              onValueChange={(value) => {
                setAmbientSound(value as AmbientSoundId);
                setIsAmbientPlaying(value !== "none");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um som ambiente" />
              </SelectTrigger>
              <SelectContent>
                {AMBIENT_SOUNDS.map((sound) => {
                  const Icon = "icon" in sound ? sound.icon : Volume2;
                  return (
                    <SelectItem key={sound.id} value={sound.id}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {sound.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Timer Display */}
          <div className="flex flex-col items-center justify-center space-y-6 py-8">
            <div className={`text-7xl font-bold tabular-nums ${getPhaseColor()} transition-all duration-300`}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-xl font-medium text-muted-foreground">
              {getPhaseLabel()}
            </div>
            <Progress value={getProgress()} className="w-full max-w-md h-2" />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={toggleTimer}
              size="lg"
              variant={isRunning ? "outline" : "default"}
              className="min-w-[140px]"
            >
              {isRunning ? (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Iniciar
                </>
              )}
            </Button>
            <Button onClick={resetTimer} size="lg" variant="outline" disabled={isRunning}>
              <RotateCcw className="h-5 w-5 mr-2" />
              Resetar
            </Button>
          </div>

          {/* Info */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>
              {phase === "study"
                ? "Foque completamente na tarefa. Evite distrações!"
                : phase === "break"
                ? "Descanse um pouco. Você merece!"
                : "Pausa longa! Recarregue suas energias."}
            </p>
            {phase === "study" && (
              <p className="text-xs">
                O tempo será registrado automaticamente quando o pomodoro completar.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
