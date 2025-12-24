"use client";
import { useState, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  Play,
  Square,
} from "lucide-react";
import { useVoiceAccessibility } from "@/hooks/useVoiceAccessibility";
import { toast } from "sonner";

function VoiceAccessibilityComponent() {
  const {
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
  } = useVoiceAccessibility();

  const [open, setOpen] = useState(false);
  const [testText, setTestText] = useState(
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
  );

  // Memoizar handlers para evitar re-renders
  const handleToggleVoice = useCallback(
    (enabled: boolean) => {
      updateSettings({ enabled });
      if (!enabled) {
        stopSpeaking();
        stopListening();
      }
    },
    [updateSettings, stopSpeaking, stopListening]
  );

  const handleTestVoice = useCallback(() => {
    if (testText.trim()) {
      speak(testText);
      toast.success("Reproduzindo texto...");
    }
  }, [testText, speak]);

  // Early return otimizado
  if (!isSupported) {
    return null; // Não mostrar se não houver suporte
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Acessibilidade por voz"
          title="Acessibilidade por voz"
        >
          <Mic className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Acessibilidade por Voz
          </DialogTitle>
          <DialogDescription>
            Use comandos de voz e leitura de texto para navegar na plataforma
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Ativar/Desativar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="voice-enabled" className="text-sm font-medium">
                Ativar Acessibilidade por Voz
              </Label>
              <Switch
                id="voice-enabled"
                checked={settings.enabled}
                onCheckedChange={handleToggleVoice}
                aria-label="Ativar acessibilidade por voz"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Habilita leitura de texto e comandos de voz
            </p>
          </div>

          {settings.enabled && (
            <>
              {/* Leitura de Texto */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">
                    Leitura de Texto
                  </Label>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="voice-rate"
                      className="text-xs text-muted-foreground"
                    >
                      Velocidade: {settings.rate.toFixed(1)}x
                    </Label>
                    <Slider
                      id="voice-rate"
                      min={0.5}
                      max={2}
                      step={0.1}
                      value={[settings.rate]}
                      onValueChange={(values: number[]) =>
                        updateSettings({ rate: values[0] })
                      }
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="voice-pitch"
                      className="text-xs text-muted-foreground"
                    >
                      Tom: {settings.pitch.toFixed(1)}
                    </Label>
                    <Slider
                      id="voice-pitch"
                      min={0.5}
                      max={2}
                      step={0.1}
                      value={[settings.pitch]}
                      onValueChange={(values: number[]) =>
                        updateSettings({ pitch: values[0] })
                      }
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="voice-volume"
                      className="text-xs text-muted-foreground"
                    >
                      Volume: {Math.round(settings.volume * 100)}%
                    </Label>
                    <Slider
                      id="voice-volume"
                      min={0}
                      max={1}
                      step={0.1}
                      value={[settings.volume]}
                      onValueChange={(values: number[]) =>
                        updateSettings({ volume: values[0] })
                      }
                      className="mt-2"
                    />
                  </div>

                  {/* Teste de voz */}
                  <div className="space-y-2">
                    <Label htmlFor="test-text" className="text-xs">
                      Testar Leitura
                    </Label>
                    <div className="flex gap-2">
                      <input
                        id="test-text"
                        type="text"
                        value={testText}
                        onChange={(e) => setTestText(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border rounded-md"
                        placeholder="Digite um texto para testar..."
                      />
                      <Button
                        size="sm"
                        onClick={handleTestVoice}
                        disabled={isSpeaking || !testText.trim()}
                        variant="outline"
                      >
                        {isSpeaking ? (
                          <Square className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {isSpeaking && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={stopSpeaking}
                        className="w-full"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Parar Leitura
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Comandos de Voz */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Comandos de Voz</Label>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Use comandos de voz para navegar
                    </p>
                    <Button
                      size="sm"
                      variant={isListening ? "destructive" : "default"}
                      onClick={isListening ? stopListening : startListening}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="h-4 w-4 mr-2" />
                          Parar
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4 mr-2" />
                          Iniciar
                        </>
                      )}
                    </Button>
                  </div>

                  {isListening && (
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground mb-1">
                        Ouvindo...
                      </p>
                      {transcript && <p className="text-sm">{transcript}</p>}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="font-medium">Comandos disponíveis:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>"Ir para dashboard"</li>
                      <li>"Ir para disciplinas"</li>
                      <li>"Ir para anotações"</li>
                      <li>"Ler página"</li>
                      <li>"Parar leitura"</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Memoizar componente para evitar re-renders desnecessários
export const VoiceAccessibility = memo(VoiceAccessibilityComponent);
