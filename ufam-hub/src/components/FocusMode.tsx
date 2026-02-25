"use client";

import { useState, useEffect } from "react";
import { useFocusMode } from "@/contexts/FocusModeContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function FocusMode() {
  const focusMode = useFocusMode();
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(focusMode.settings);

  const { isActive, settings, activate, deactivate } = focusMode;

  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  const handleActivate = () => {
    activate(tempSettings);
    setShowSettings(false);
  };

  const handleDeactivate = () => {
    deactivate();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key === "F" &&
        !e.altKey
      ) {
        e.preventDefault();
        if (isActive) {
          deactivate();
        } else {
          setShowSettings(true);
        }
      }
      if (isActive && e.key === "Escape" && !e.metaKey && !e.ctrlKey) {
        deactivate();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, deactivate]);

  if (!isActive) {
    return null;
  }

  return (
    <>
      {/* Barra superior minimalista */}
      <div className="fixed top-0 left-0 right-0 h-12 border-b border-border/50 flex items-center justify-between px-4 bg-background/95 backdrop-blur-sm z-[100]">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">Modo Foco Ativo</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="h-8 w-8"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeactivate}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Modal de Configurações */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurações do Modo Foco</DialogTitle>
            <DialogDescription>
              Personalize sua experiência de estudo focado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Tema</Label>
              <Select
                value={tempSettings.theme}
                onValueChange={(value: "dark" | "light" | "sepia") =>
                  setTempSettings({ ...tempSettings, theme: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Escuro</SelectItem>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="sepia">Sépia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontSize">Tamanho da Fonte</Label>
              <Select
                value={tempSettings.fontSize}
                onValueChange={(
                  value: "normal" | "large" | "extra-large"
                ) => setTempSettings({ ...tempSettings, fontSize: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                  <SelectItem value="extra-large">Extra Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="blockNotifications"
                checked={tempSettings.blockNotifications}
                onChange={(e) =>
                  setTempSettings({
                    ...tempSettings,
                    blockNotifications: e.target.checked,
                  })
                }
                className="rounded"
              />
              <Label htmlFor="blockNotifications" className="cursor-pointer">
                Bloquear notificações durante o modo foco
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoStartPomodoro"
                checked={tempSettings.autoStartPomodoro}
                onChange={(e) =>
                  setTempSettings({
                    ...tempSettings,
                    autoStartPomodoro: e.target.checked,
                  })
                }
                className="rounded"
              />
              <Label htmlFor="autoStartPomodoro" className="cursor-pointer">
                Iniciar Pomodoro Timer automaticamente
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancelar
            </Button>
            <Button onClick={handleActivate}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
