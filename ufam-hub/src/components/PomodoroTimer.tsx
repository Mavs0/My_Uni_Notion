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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDisciplinas } from "@/hooks/useDisciplinas";
import { toast } from "sonner";

type PomodoroPhase = "study" | "break" | "longBreak";

const STUDY_TIME = 25 * 60; // 25 minutos em segundos
const BREAK_TIME = 5 * 60; // 5 minutos em segundos
const LONG_BREAK_TIME = 15 * 60; // 15 minutos em segundos (após 4 pomodoros)

// Sons ambiente disponíveis
// Para adicionar sons: coloque arquivos .mp3 em public/audio/ e atualize as URLs abaixo
// Exemplo: se você adicionar rain.mp3 em public/audio/, use: url: "/audio/rain.mp3"
const AMBIENT_SOUNDS = [
  { id: "none", name: "Sem som", icon: VolumeX },
  {
    id: "rain",
    name: "Chuva",
    // Adicione rain.mp3 em public/audio/ e descomente a linha abaixo:
    // url: "/audio/rain.mp3",
    // IMPORTANTE: A URL deve apontar diretamente para um arquivo .mp3/.wav/.ogg
    // Sites como rainymood.com não funcionam porque são páginas HTML, não arquivos de áudio
    url: null, // Configure uma URL válida de arquivo de áudio ou use arquivo local
  },
  {
    id: "cafe",
    name: "Cafeteria",
    // Adicione cafe.mp3 em public/audio/ e descomente a linha abaixo:
    // url: "/audio/cafe.mp3",
    url: null, // Configure uma URL ou arquivo local (veja public/audio/README.md)
  },
  {
    id: "street",
    name: "Rua",
    // Adicione street.mp3 em public/audio/ e descomente a linha abaixo:
    // url: "/audio/street.mp3",
    url: null, // Configure uma URL ou arquivo local (veja public/audio/README.md)
  },
  {
    id: "forest",
    name: "Floresta",
    // Adicione forest.mp3 em public/audio/ e descomente a linha abaixo:
    // url: "/audio/forest.mp3",
    url: null, // Configure uma URL ou arquivo local (veja public/audio/README.md)
  },
  {
    id: "ocean",
    name: "Oceano",
    // Adicione ocean.mp3 em public/audio/ e descomente a linha abaixo:
    // url: "/audio/ocean.mp3",
    url: null, // Configure uma URL ou arquivo local (veja public/audio/README.md)
  },
  { id: "white-noise", name: "Ruído Branco", url: null },
] as const;

type AmbientSoundId = (typeof AMBIENT_SOUNDS)[number]["id"];

export function PomodoroTimer() {
  const { disciplinas } = useDisciplinas();
  const [timeLeft, setTimeLeft] = useState(STUDY_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<PomodoroPhase>("study");
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<string>("");
  const [ambientSound, setAmbientSound] = useState<AmbientSoundId>("none");
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const whiteNoiseNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Inicializar disciplina selecionada
  useEffect(() => {
    if (disciplinas.length > 0 && !selectedDisciplinaId) {
      setSelectedDisciplinaId(disciplinas[0].id);
    }
  }, [disciplinas, selectedDisciplinaId]);

  // Função para gerar ruído branco
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
    gainNode.gain.value = 0.1; // Volume baixo

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

  // Gerenciar reprodução de sons ambiente
  useEffect(() => {
    // Parar qualquer som anterior
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
      // Gerar ruído branco
      const cleanup = generateWhiteNoise();
      setIsAmbientPlaying(true);
      return cleanup;
    } else if ("url" in soundConfig && soundConfig.url) {
      // Validar se a URL parece ser um arquivo de áudio
      const audioUrl = soundConfig.url as string;
      const urlLower = audioUrl.toLowerCase();
      const isValidAudioUrl =
        urlLower.endsWith(".mp3") ||
        urlLower.endsWith(".wav") ||
        urlLower.endsWith(".ogg") ||
        urlLower.endsWith(".m4a") ||
        urlLower.includes("/audio/") ||
        urlLower.startsWith("/audio/");

      if (!isValidAudioUrl && !audioUrl.startsWith("/")) {
        console.warn(
          `URL "${soundConfig.url}" não parece ser um arquivo de áudio válido. URLs devem apontar diretamente para arquivos .mp3, .wav, .ogg, etc.`
        );
        toast.error(
          `URL inválida para "${soundConfig.name}". Use um arquivo local (ex: /audio/rain.mp3) ou uma URL direta para arquivo de áudio.`
        );
        setIsAmbientPlaying(false);
        return;
      }

      // Reproduzir áudio de URL ou arquivo local
      const audio = new Audio(audioUrl);
      audio.loop = true;
      audio.volume = 0.3; // Volume moderado

      // Tratar erros de carregamento
      audio.addEventListener("error", (e) => {
        console.error("Erro ao carregar som ambiente:", e);
        toast.error(
          `Não foi possível carregar "${soundConfig.name}". Verifique se a URL está correta ou adicione um arquivo em public/audio/`
        );
        setIsAmbientPlaying(false);
      });

      audio.play().catch((error) => {
        console.error("Erro ao reproduzir som ambiente:", error);
        toast.error(
          `Não foi possível reproduzir "${soundConfig.name}". Verifique se o arquivo existe e está acessível.`
        );
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
    } else {
      // Som não disponível (URL null ou inválida)
      toast.warning(
        "Este som ambiente não está disponível. Adicione um arquivo de áudio em public/audio/ ou configure uma URL válida."
      );
      setIsAmbientPlaying(false);
    }
  }, [ambientSound, isAmbientPlaying]);

  // Limpar recursos ao desmontar
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

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = async () => {
    setIsRunning(false);

    if (phase === "study") {
      const newCompleted = completedPomodoros + 1;
      setCompletedPomodoros(newCompleted);

      // Registrar tempo estudado
      if (selectedDisciplinaId) {
        try {
          const minutosEstudados = STUDY_TIME / 60; // 25 minutos
          const horasEstudadas = minutosEstudados / 60; // ~0.42 horas

          // Usar a API de progresso existente
          // Como a API espera blocos_assistidos e horas_por_bloco,
          // vamos calcular: 1 pomodoro = 25min = ~0.42h
          // Vamos registrar como 1 bloco de ~0.42 horas
          const response = await fetch("/api/progresso", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              disciplinaId: selectedDisciplinaId,
              blocosAssistidos: 1,
              horasPorBloco: horasEstudadas,
            }),
          });

          if (response.ok) {
            toast.success(
              `Pomodoro completo! ${minutosEstudados} minutos registrados.`
            );
          }
        } catch (error) {
          console.error("Erro ao registrar pomodoro:", error);
        }
      }

      // Após 4 pomodoros, fazer pausa longa
      if (newCompleted % 4 === 0) {
        setPhase("longBreak");
        setTimeLeft(LONG_BREAK_TIME);
        toast.success(
          "4 Pomodoros completos! Hora de uma pausa longa de 15 minutos."
        );
      } else {
        setPhase("break");
        setTimeLeft(BREAK_TIME);
        toast.success("Pomodoro completo! Hora de uma pausa de 5 minutos.");
      }
    } else {
      // Pausa terminada, voltar ao estudo
      setPhase("study");
      setTimeLeft(STUDY_TIME);
      toast.info("Pausa terminada! Hora de voltar ao estudo.");
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (phase === "study") {
      setTimeLeft(STUDY_TIME);
    } else if (phase === "break") {
      setTimeLeft(BREAK_TIME);
    } else {
      setTimeLeft(LONG_BREAK_TIME);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getProgress = () => {
    const total =
      phase === "study"
        ? STUDY_TIME
        : phase === "break"
        ? BREAK_TIME
        : LONG_BREAK_TIME;
    return ((total - timeLeft) / total) * 100;
  };

  const getPhaseLabel = () => {
    if (phase === "study") return "Foco";
    if (phase === "break") return "Pausa Curta";
    return "Pausa Longa";
  };

  const getPhaseIcon = () => {
    if (phase === "study") return <CheckCircle2 className="h-6 w-6" />;
    return <Coffee className="h-6 w-6" />;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {getPhaseIcon()}
            Pomodoro Timer
          </span>
          <div className="text-sm font-normal text-muted-foreground">
            {completedPomodoros}{" "}
            {completedPomodoros === 1 ? "pomodoro" : "pomodoros"} completos
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seletor de Disciplina */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Disciplina</label>
          <Select
            value={selectedDisciplinaId}
            onValueChange={setSelectedDisciplinaId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma disciplina" />
            </SelectTrigger>
            <SelectContent>
              {disciplinas.map((disc) => (
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
            <label className="text-sm font-medium">Som Ambiente</label>
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
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <div className="text-6xl font-bold tabular-nums">
            {formatTime(timeLeft)}
          </div>
          <div className="text-lg text-muted-foreground">{getPhaseLabel()}</div>
          <Progress value={getProgress()} className="w-full max-w-md" />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={toggleTimer}
            size="lg"
            variant={isRunning ? "outline" : "default"}
            className="min-w-[120px]"
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
          <Button onClick={resetTimer} size="lg" variant="outline">
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
              O tempo será registrado automaticamente quando o pomodoro
              completar.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
