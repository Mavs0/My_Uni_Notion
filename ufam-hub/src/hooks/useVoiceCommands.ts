"use client";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

interface VoiceCommand {
  pattern: RegExp;
  action: (matches: RegExpMatchArray) => void;
  description: string;
}

interface UseVoiceCommandsProps {
  transcript: string;
  isListening: boolean;
  enabled: boolean;
}

export function useVoiceCommands({
  transcript,
  isListening,
  enabled,
}: UseVoiceCommandsProps) {
  const router = useRouter();

  const commands: VoiceCommand[] = useMemo(
    () => [
      {
        pattern: /ir para (?:o )?dashboard/i,
        action: () => router.push("/dashboard"),
        description: "Navegar para o dashboard",
      },
      {
        pattern: /ir para (?:as )?disciplinas?/i,
        action: () => router.push("/disciplinas"),
        description: "Navegar para disciplinas",
      },
      {
        pattern: /ir para (?:as )?anotações?/i,
        action: () => router.push("/busca-anotacoes"),
        description: "Navegar para anotações",
      },
      {
        pattern: /ir para (?:o )?calendário/i,
        action: () => router.push("/calendar"),
        description: "Navegar para calendário",
      },
      {
        pattern: /ir para (?:o )?chat/i,
        action: () => router.push("/chat"),
        description: "Navegar para chat",
      },
      {
        pattern: /ir para (?:o )?perfil/i,
        action: () => router.push("/perfil"),
        description: "Navegar para perfil",
      },
      {
        pattern: /ir para (?:as )?configurações?/i,
        action: () => router.push("/configuracoes"),
        description: "Navegar para configurações",
      },
      {
        pattern: /ler (?:a )?página/i,
        action: () => {
          const mainContent = document.querySelector("main");
          if (mainContent) {
            const text = mainContent.textContent || "";
            // Usar a API de síntese de voz diretamente
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "pt-BR";
            window.speechSynthesis.speak(utterance);
          }
        },
        description: "Ler o conteúdo da página",
      },
      {
        pattern: /parar (?:a )?leitura/i,
        action: () => {
          window.speechSynthesis.cancel();
        },
        description: "Parar a leitura atual",
      },
    ],
    [router]
  );

  useEffect(() => {
    if (!isListening || !enabled || !transcript) return;

    // Processar comandos quando há uma transcrição final
    const processCommands = () => {
      for (const command of commands) {
        const matches = transcript.match(command.pattern);
        if (matches) {
          console.log(`🎤 Comando reconhecido: ${command.description}`);
          command.action(matches);
          return;
        }
      }
    };

    processCommands();
  }, [transcript, isListening, enabled]);
}
