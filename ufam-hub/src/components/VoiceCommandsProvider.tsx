"use client";
import { useVoiceAccessibility } from "@/hooks/useVoiceAccessibility";
import { useVoiceCommands } from "@/hooks/useVoiceCommands";
import { ReactNode, useMemo } from "react";

export function VoiceCommandsProvider({ children }: { children: ReactNode }) {
  const { transcript, isListening, settings } = useVoiceAccessibility();

  // Só inicializar comandos de voz se estiverem habilitados
  const shouldEnableCommands = useMemo(
    () => settings.enabled && isListening,
    [settings.enabled, isListening]
  );

  useVoiceCommands({
    transcript,
    isListening,
    enabled: shouldEnableCommands,
  });

  return <>{children}</>;
}
