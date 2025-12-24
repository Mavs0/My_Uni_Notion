"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accessibility,
  Type,
  Contrast,
  Keyboard,
  Eye,
  Mic,
} from "lucide-react";
import { VoiceAccessibility } from "./VoiceAccessibility";

export function AccessibilitySettings({
  standalone = false,
}: {
  standalone?: boolean;
}) {
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">(
    "normal"
  );
  const [reducedMotion, setReducedMotion] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const savedHighContrast = localStorage.getItem(
      "accessibility-high-contrast"
    );
    const savedFontSize = localStorage.getItem("accessibility-font-size");
    const savedReducedMotion = localStorage.getItem(
      "accessibility-reduced-motion"
    );

    if (savedHighContrast === "true") {
      setHighContrast(true);
      document.documentElement.classList.add("high-contrast");
    }
    if (savedFontSize) {
      setFontSize(savedFontSize as "normal" | "large" | "xlarge");
      document.documentElement.setAttribute("data-font-size", savedFontSize);
    }
    if (savedReducedMotion === "true") {
      setReducedMotion(true);
      document.documentElement.classList.add("reduced-motion");
    }
  }, []);

  const handleHighContrastChange = (checked: boolean) => {
    setHighContrast(checked);
    if (checked) {
      document.documentElement.classList.add("high-contrast");
      localStorage.setItem("accessibility-high-contrast", "true");
    } else {
      document.documentElement.classList.remove("high-contrast");
      localStorage.setItem("accessibility-high-contrast", "false");
    }
  };

  const handleFontSizeChange = (size: "normal" | "large" | "xlarge") => {
    setFontSize(size);
    document.documentElement.setAttribute("data-font-size", size);
    localStorage.setItem("accessibility-font-size", size);
  };

  const handleReducedMotionChange = (checked: boolean) => {
    setReducedMotion(checked);
    if (checked) {
      document.documentElement.classList.add("reduced-motion");
      localStorage.setItem("accessibility-reduced-motion", "true");
    } else {
      document.documentElement.classList.remove("reduced-motion");
      localStorage.setItem("accessibility-reduced-motion", "false");
    }
  };

  const renderContent = () => (
    <div className="space-y-6 py-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Contrast className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="high-contrast" className="text-sm font-medium">
            Alto Contraste
          </Label>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Aumenta o contraste entre texto e fundo para melhor legibilidade
          </p>
          <Switch
            id="high-contrast"
            checked={highContrast}
            onCheckedChange={handleHighContrastChange}
            aria-label="Ativar alto contraste"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="font-size" className="text-sm font-medium">
            Tamanho da Fonte
          </Label>
        </div>
        <Select value={fontSize} onValueChange={handleFontSizeChange}>
          <SelectTrigger
            id="font-size"
            aria-label="Selecionar tamanho da fonte"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="large">Grande</SelectItem>
            <SelectItem value="xlarge">Extra Grande</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Ajuste o tamanho do texto para melhor leitura
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="reduced-motion" className="text-sm font-medium">
            Reduzir Animação
          </Label>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Reduz animações e transições para evitar desconforto visual
          </p>
          <Switch
            id="reduced-motion"
            checked={reducedMotion}
            onCheckedChange={handleReducedMotionChange}
            aria-label="Ativar redução de movimento"
          />
        </div>
      </div>

      <div className="pt-4 border-t">
        <div className="flex items-center gap-2 mb-3">
          <Mic className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Acessibilidade por Voz</Label>
        </div>
        <div className="mb-4">
          <VoiceAccessibility />
        </div>
      </div>

      <div className="pt-4 border-t">
        <div className="flex items-center gap-2 mb-2">
          <Keyboard className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Atalhos de Teclado</Label>
        </div>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Buscar</span>
            <kbd className="px-2 py-1 rounded border bg-muted">⌘K</kbd>
          </div>
          <div className="flex justify-between">
            <span>Pular para conteúdo</span>
            <kbd className="px-2 py-1 rounded border bg-muted">Tab</kbd>
          </div>
          <div className="flex justify-between">
            <span>Navegar menu</span>
            <kbd className="px-2 py-1 rounded border bg-muted">↑↓</kbd>
          </div>
        </div>
      </div>
    </div>
  );

  if (standalone) {
    return renderContent();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Configurações de acessibilidade"
          title="Configurações de acessibilidade"
        >
          <Accessibility className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Accessibility className="h-5 w-5" />
            Configurações de Acessibilidade
          </DialogTitle>
          <DialogDescription>
            Personalize a experiência de acordo com suas necessidades
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}

export function AccessibilitySettingsStandalone() {
  return <AccessibilitySettings standalone={true} />;
}
