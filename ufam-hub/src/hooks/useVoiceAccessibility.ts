"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// Tipos para Web Speech API
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface VoiceSettings {
  enabled: boolean;
  rate: number; // 0.1 a 10
  pitch: number; // 0 a 2
  volume: number; // 0 a 1
  lang: string; // 'pt-BR'
}

const DEFAULT_SETTINGS: VoiceSettings = {
  enabled: false,
  rate: 1,
  pitch: 1,
  volume: 1,
  lang: "pt-BR",
};

export function useVoiceAccessibility() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_SETTINGS);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Verificar suporte a Web Speech API apenas uma vez
    if (typeof window === "undefined") return;

    // Verificar suporte de forma mais eficiente
    const hasSpeechSynthesis = "speechSynthesis" in window;
    const hasSpeechRecognition =
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window;

    setIsSupported(hasSpeechSynthesis && hasSpeechRecognition);

    if (hasSpeechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }

    // Carregar configurações salvas de forma otimizada
    try {
      const savedSettings = localStorage.getItem(
        "voice-accessibility-settings"
      );
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (e) {
      console.error("Erro ao carregar configurações de voz:", e);
    }
  }, []);

  // Text-to-Speech (Leitura de texto)
  const speak = useCallback(
    (text: string, options?: Partial<VoiceSettings>) => {
      if (!synthRef.current || !settings.enabled) return;

      // Cancelar qualquer fala anterior
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voiceSettings = { ...settings, ...options };

      utterance.lang = voiceSettings.lang;
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;
      utterance.volume = voiceSettings.volume;

      // Tentar encontrar voz em português
      const voices = synthRef.current.getVoices();
      const ptVoice = voices.find(
        (v) => v.lang.startsWith("pt") || v.lang.startsWith("pt-BR")
      );
      if (ptVoice) {
        utterance.voice = ptVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    },
    [settings]
  );

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Speech-to-Text (Reconhecimento de voz)
  const startListening = useCallback(() => {
    if (!isSupported) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("Reconhecimento de voz não suportado");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = settings.lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: unknown) => {
      try {
        const errorEvent = event as SpeechRecognitionErrorEvent;
        const errorCode = errorEvent?.error;

        if (errorCode) {
          if (errorCode === "not-allowed") {
            console.warn("Permissão de microfone negada");
          } else if (errorCode === "no-speech") {
            console.warn("Nenhuma fala detectada");
          } else {
            console.error("Erro no reconhecimento de voz:", errorCode);
          }
        } else {
          console.error("Erro no reconhecimento de voz: erro desconhecido");
        }
      } catch (err) {
        console.error(
          "Erro ao processar evento de erro do reconhecimento de voz"
        );
      } finally {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, settings.lang]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Atualizar configurações
  const updateSettings = useCallback(
    (newSettings: Partial<VoiceSettings>) => {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      localStorage.setItem(
        "voice-accessibility-settings",
        JSON.stringify(updated)
      );
    },
    [settings]
  );

  return {
    isSupported,
    isSpeaking,
    isListening,
    transcript,
    settings,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    updateSettings,
  };
}
