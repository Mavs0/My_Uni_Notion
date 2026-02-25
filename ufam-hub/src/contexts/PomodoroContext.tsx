"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { toast } from "sonner";

export type PomodoroPhase = "study" | "break" | "longBreak";

export interface PomodoroSettings {
  studyTime: number;
  breakTime: number;
  longBreakTime: number;
  enableNotifications: boolean;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  longBreakInterval: number;
}

const DEFAULT_STUDY = 25 * 60;
const DEFAULT_BREAK = 5 * 60;
const DEFAULT_LONG = 15 * 60;
const STORAGE_KEY = "pomodoro-settings";

const defaultSettings: PomodoroSettings = {
  studyTime: DEFAULT_STUDY,
  breakTime: DEFAULT_BREAK,
  longBreakTime: DEFAULT_LONG,
  enableNotifications: true,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  longBreakInterval: 4,
};

function loadSettings(): PomodoroSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return { ...defaultSettings, ...JSON.parse(s) };
  } catch {}
  return defaultSettings;
}

interface SessionInfo {
  disciplinas: Array<{ id: string; nome: string }>;
  selectedDisciplinaId: string;
  sessionStart: Date | null;
}

interface PomodoroContextValue {
  timeLeft: number;
  isRunning: boolean;
  phase: PomodoroPhase;
  settings: PomodoroSettings;
  setSettings: React.Dispatch<React.SetStateAction<PomodoroSettings>>;
  completedPomodoros: number;
  toggleTimer: () => void;
  resetTimer: () => void;
  getProgress: () => number;
  getPhaseLabel: () => string;
  getPhaseColor: () => string;
  formatTime: (s: number) => string;
  hasActiveSession: boolean;
  registerSessionInfo: (info: Partial<SessionInfo>) => void;
}

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PomodoroSettings>(loadSettings);
  const [timeLeft, setTimeLeft] = useState(settings.studyTime);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<PomodoroPhase>("study");
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const sessionInfoRef = useRef<SessionInfo>({
    disciplinas: [],
    selectedDisciplinaId: "",
    sessionStart: null,
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings]);

  useEffect(() => {
    if (!isRunning) {
      if (phase === "study") setTimeLeft(settings.studyTime);
      else if (phase === "break") setTimeLeft(settings.breakTime);
      else setTimeLeft(settings.longBreakTime);
    }
  }, [settings, phase, isRunning]);

  const sendNotification = useCallback((msg: string) => {
    if (!settings.enableNotifications) return;
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Pomodoro", { body: msg, icon: "/favicon.ico" });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, [settings.enableNotifications]);

  const handleComplete = useCallback(async () => {
    setIsRunning(false);
    const info = sessionInfoRef.current;
    if (phase === "study") sessionInfoRef.current.sessionStart = null;

    if (phase === "study") {
      setCompletedPomodoros((prev) => prev + 1);

      if (info.selectedDisciplinaId) {
        try {
          const minutosEstudados = settings.studyTime / 60;
          const res = await fetch("/api/progresso", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              disciplinaId: info.selectedDisciplinaId,
              blocosAssistidos: 1,
              horasPorBloco: minutosEstudados / 60,
            }),
          });
          if (res.ok) toast.success(`Pomodoro completo! ${minutosEstudados} min registrados.`);
        } catch (e) {
          console.error("Erro ao registrar pomodoro:", e);
        }
        try {
          const disc = info.disciplinas.find((d) => d.id === info.selectedDisciplinaId);
          const titulo = disc
            ? `Completou ${settings.studyTime / 60} min de foco em ${disc.nome}`
            : `Completou um Pomodoro de ${settings.studyTime / 60} minutos`;
          await fetch("/api/feed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tipo: "pomodoro_completo",
              titulo,
              visibilidade: "public",
              referencia_id: info.selectedDisciplinaId || undefined,
              referencia_tipo: info.selectedDisciplinaId ? "disciplina" : undefined,
            }),
          });
        } catch {}
      }

      sendNotification("Pomodoro completo! Hora de uma pausa.");

      setCompletedPomodoros((prev) => {
        const next = prev + 1;
        if (next % settings.longBreakInterval === 0) {
          setPhase("longBreak");
          setTimeLeft(settings.longBreakTime);
          toast.success(`${settings.longBreakInterval} Pomodoros! Pausa longa.`);
          if (settings.autoStartBreaks) setTimeout(() => setIsRunning(true), 1000);
        } else {
          setPhase("break");
          setTimeLeft(settings.breakTime);
          toast.success("Pomodoro completo! Hora de uma pausa.");
          if (settings.autoStartBreaks) setTimeout(() => setIsRunning(true), 1000);
        }
        return next;
      });
    } else {
      setPhase("study");
      setTimeLeft(settings.studyTime);
      toast.info("Pausa terminada! Hora de voltar ao estudo.");
      sendNotification("Pausa terminada!");
      if (settings.autoStartPomodoros) setTimeout(() => setIsRunning(true), 1000);
    }
  }, [phase, settings, sendNotification]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      if (phase === "study") {
        sessionInfoRef.current.sessionStart = sessionInfoRef.current.sessionStart || new Date();
      }
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
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
      if (phase === "study") sessionInfoRef.current.sessionStart = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, phase, handleComplete]);

  const toggleTimer = useCallback(() => setIsRunning((r) => !r), []);
  const resetTimer = useCallback(() => {
    setIsRunning(false);
    sessionInfoRef.current.sessionStart = null;
    if (phase === "study") setTimeLeft(settings.studyTime);
    else if (phase === "break") setTimeLeft(settings.breakTime);
    else setTimeLeft(settings.longBreakTime);
  }, [phase, settings]);

  const getProgress = useCallback(() => {
    const total = phase === "study" ? settings.studyTime : phase === "break" ? settings.breakTime : settings.longBreakTime;
    return ((total - timeLeft) / total) * 100;
  }, [phase, settings, timeLeft]);

  const getPhaseLabel = useCallback(() => {
    if (phase === "study") return "Foco";
    if (phase === "break") return "Pausa Curta";
    return "Pausa Longa";
  }, [phase]);

  const getPhaseColor = useCallback(() => {
    if (phase === "study") return "text-primary";
    if (phase === "break") return "text-blue-500";
    return "text-purple-500";
  }, [phase]);

  const formatTime = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }, []);

  const totalForPhase = phase === "study" ? settings.studyTime : phase === "break" ? settings.breakTime : settings.longBreakTime;
  const hasActiveSession = isRunning || timeLeft < totalForPhase;

  const registerSessionInfo = useCallback((info: Partial<SessionInfo>) => {
    sessionInfoRef.current = { ...sessionInfoRef.current, ...info };
  }, []);

  const value: PomodoroContextValue = {
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
    hasActiveSession,
    registerSessionInfo,
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoro must be used within PomodoroProvider");
  return ctx;
}

export function usePomodoroOptional() {
  return useContext(PomodoroContext);
}
