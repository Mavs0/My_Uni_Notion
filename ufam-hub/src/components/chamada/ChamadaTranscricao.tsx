"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TranscriptLine {
  id: string;
  text: string;
  time: string;
  isInterim?: boolean;
}

// Web Speech API – Chrome, Edge, Safari
const SpeechRecognition =
  typeof window !== "undefined"
    ? (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    : undefined;

interface SpeechRecognitionResultEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export function ChamadaTranscricao() {
  const [isSupported, setIsSupported] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [lines, setLines] = React.useState<TranscriptLine[]>([]);
  const [interim, setInterim] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const recognitionRef = React.useRef<unknown>(null);
  const nextIdRef = React.useRef(0);
  const networkRetryCountRef = React.useRef(0);
  const retryTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRequestedStopRef = React.useRef(false);

  React.useEffect(() => {
    setIsSupported(Boolean(SpeechRecognition));
  }, []);

  type RecognitionInstance = {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start(): void;
    stop(): void;
    onresult: (e: SpeechRecognitionResultEvent) => void;
    onerror: (e: SpeechRecognitionErrorEvent) => void;
    onend?: () => void;
    onstart?: () => void;
  };

  const SpeechRecognitionConstructor = SpeechRecognition as (new () => RecognitionInstance) | undefined;

  React.useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [lines, interim]);

  const startListening = React.useCallback((isRetry = false) => {
    if (!SpeechRecognitionConstructor || !isSupported) {
      setError("Transcrição não suportada neste navegador.");
      return;
    }

    if (!isRetry) {
      setError(null);
      networkRetryCountRef.current = 0;
      userRequestedStopRef.current = false;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    try {
      const recognition: RecognitionInstance = new SpeechRecognitionConstructor!() as RecognitionInstance;
      recognition.lang = "pt-BR";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionResultEvent) => {
        let interimText = "";
        let finalText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript ?? "";
          if (result.isFinal) {
            finalText += text;
          } else {
            interimText += text;
          }
        }

        if (finalText.trim()) {
          setLines((prev) => [
            ...prev,
            {
              id: `t-${nextIdRef.current++}`,
              text: finalText.trim(),
              time: new Date().toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
              isInterim: false,
            },
          ]);
        }
        setInterim(interimText);
      };

      recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
        if (e.error === "not-allowed") {
          setError("Permissão de microfone negada. Ative o microfone para transcrever.");
          setIsListening(false);
        } else if (e.error === "network") {
          recognitionRef.current = null;
          const retries = networkRetryCountRef.current;
          if (retries < 4) {
            networkRetryCountRef.current = retries + 1;
            setError("Reconectando…");
            retryTimeoutRef.current = setTimeout(() => {
              retryTimeoutRef.current = null;
              startListening(true);
            }, 2000);
          } else {
            networkRetryCountRef.current = 0;
            setError("Reconhecimento de voz indisponível no momento. Clique em \"Tentar novamente\" ou use Chrome/Edge.");
            setIsListening(false);
          }
        } else if (e.error === "service-not-allowed") {
          setError("Transcrição exige HTTPS. Abra o site com https://");
          setIsListening(false);
        } else if (e.error !== "no-speech") {
          setError("Erro ao transcrever. Tente novamente.");
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        if (userRequestedStopRef.current) {
          setIsListening(false);
          setInterim("");
          return;
        }
        if (retryTimeoutRef.current) return;
        setInterim("");
        retryTimeoutRef.current = setTimeout(() => {
          retryTimeoutRef.current = null;
          startListening(true);
        }, 400);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError("Não foi possível iniciar a transcrição.");
      setIsListening(false);
    }
  }, [isSupported]);

  React.useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  const stopListening = React.useCallback(() => {
    userRequestedStopRef.current = true;
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    const rec = recognitionRef.current as { stop(): void } | null;
    if (rec) {
      try {
        rec.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterim("");
  }, []);

  const toggle = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const clearTranscript = () => {
    setLines([]);
    setInterim("");
    setError(null);
  };

  if (!isSupported) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <MicOff className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-foreground">Transcrição não disponível</p>
        <p className="text-xs text-muted-foreground">
          Use Chrome, Edge ou Safari para transcrição automática em português.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
        <p className="text-xs font-medium text-muted-foreground">
          Transcrição da sua fala (ao vivo)
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={isListening ? "destructive" : "default"}
            size="sm"
            className="rounded-lg gap-1.5 h-8"
            onClick={toggle}
            disabled={false}
          >
            {isListening ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Parar
              </>
            ) : (
              <>
                <Mic className="h-3.5 w-3.5" />
                Iniciar
              </>
            )}
          </Button>
          {lines.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-lg h-8 text-muted-foreground"
              onClick={clearTranscript}
            >
              Limpar
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="shrink-0 px-4 py-2 bg-destructive/10 text-destructive text-xs rounded-none flex flex-col gap-2">
          <span>{error}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit h-8 rounded-lg text-xs border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={() => {
              setError(null);
              networkRetryCountRef.current = 0;
              startListening();
            }}
          >
            Tentar novamente
          </Button>
        </div>
      )}

      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-2"
      >
        {lines.length === 0 && !interim && !isListening && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Mic className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Clique em &quot;Iniciar&quot; para transcrever sua fala em tempo real.
            </p>
          </div>
        )}

        {lines.map((line) => (
          <div
            key={line.id}
            className={cn(
              "rounded-lg px-3 py-2 text-sm",
              line.isInterim ? "bg-muted/50 text-muted-foreground italic" : "bg-muted/30 text-foreground"
            )}
          >
            <span className="text-[10px] text-muted-foreground mr-2 tabular-nums">
              {line.time}
            </span>
            {line.text}
          </div>
        ))}

        {interim.trim() && (
          <div className="rounded-lg px-3 py-2 text-sm bg-primary/10 text-foreground italic border border-primary/20">
            {interim}
          </div>
        )}
      </div>
    </div>
  );
}
