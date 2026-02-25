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

interface FocusModeSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FocusModeSettings({ open, onOpenChange }: FocusModeSettingsProps) {
  const { settings, activate } = useFocusMode();
  const [tempSettings, setTempSettings] = useState(settings);

  useEffect(() => {
    setTempSettings(settings);
  }, [settings, open]);

  const handleActivate = () => {
    activate(tempSettings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onValueChange={(value: "normal" | "large" | "extra-large") =>
                setTempSettings({ ...tempSettings, fontSize: value })
              }
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleActivate}>Ativar Modo Foco</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
