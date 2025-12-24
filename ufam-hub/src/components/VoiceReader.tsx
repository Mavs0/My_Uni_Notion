"use client";
import { useEffect, useRef } from "react";
import { useVoiceAccessibility } from "@/hooks/useVoiceAccessibility";
import { Button } from "@/components/ui/button";
import { Volume2, Square } from "lucide-react";

interface VoiceReaderProps {
  text: string;
  autoRead?: boolean;
  className?: string;
}

export function VoiceReader({
  text,
  autoRead = false,
  className,
}: VoiceReaderProps) {
  const { isSupported, isSpeaking, speak, stopSpeaking, settings } =
    useVoiceAccessibility();
  const hasReadRef = useRef(false);

  useEffect(() => {
    if (autoRead && settings.enabled && text && !hasReadRef.current) {
      // Aguardar um pouco antes de ler para garantir que o componente está montado
      const timer = setTimeout(() => {
        speak(text);
        hasReadRef.current = true;
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [autoRead, text, settings.enabled, speak]);

  if (!isSupported || !settings.enabled) {
    return null;
  }

  const handleRead = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(text);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRead}
      className={className}
      aria-label={isSpeaking ? "Parar leitura" : "Ler texto em voz alta"}
    >
      {isSpeaking ? (
        <>
          <Square className="h-4 w-4 mr-2" />
          Parar
        </>
      ) : (
        <>
          <Volume2 className="h-4 w-4 mr-2" />
          Ler
        </>
      )}
    </Button>
  );
}
