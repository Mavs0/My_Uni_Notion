"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Palette,
  Type,
  Layout,
  Image,
  Check,
  Sun,
  Moon,
  Monitor,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ThemePreset = "default" | "blue" | "green" | "purple" | "orange" | "pink";

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
}

const themePresets: Record<ThemePreset, ThemeColors> = {
  default: {
    primary: "oklch(0.922 0 0)",
    secondary: "oklch(0.269 0 0)",
    accent: "oklch(0.269 0 0)",
    background: "oklch(0.985 0 0)",
    foreground: "oklch(0.145 0 0)",
  },
  blue: {
    primary: "oklch(0.488 0.243 264.376)",
    secondary: "oklch(0.269 0 0)",
    accent: "oklch(0.488 0.243 264.376)",
    background: "oklch(0.985 0 0)",
    foreground: "oklch(0.145 0 0)",
  },
  green: {
    primary: "oklch(0.696 0.17 162.48)",
    secondary: "oklch(0.269 0 0)",
    accent: "oklch(0.696 0.17 162.48)",
    background: "oklch(0.985 0 0)",
    foreground: "oklch(0.145 0 0)",
  },
  purple: {
    primary: "oklch(0.627 0.265 303.9)",
    secondary: "oklch(0.269 0 0)",
    accent: "oklch(0.627 0.265 303.9)",
    background: "oklch(0.985 0 0)",
    foreground: "oklch(0.145 0 0)",
  },
  orange: {
    primary: "oklch(0.645 0.246 16.439)",
    secondary: "oklch(0.269 0 0)",
    accent: "oklch(0.645 0.246 16.439)",
    background: "oklch(0.985 0 0)",
    foreground: "oklch(0.145 0 0)",
  },
  pink: {
    primary: "oklch(0.769 0.188 70.08)",
    secondary: "oklch(0.269 0 0)",
    accent: "oklch(0.769 0.188 70.08)",
    background: "oklch(0.985 0 0)",
    foreground: "oklch(0.145 0 0)",
  },
};

const fontOptions = [
  { value: "inter", label: "Inter (Padrão)" },
  { value: "roboto", label: "Roboto" },
  { value: "open-sans", label: "Open Sans" },
  { value: "lato", label: "Lato" },
  { value: "montserrat", label: "Montserrat" },
  { value: "poppins", label: "Poppins" },
];

const densityOptions = [
  { value: "compact", label: "Compacto", spacing: "0.75rem" },
  { value: "normal", label: "Normal", spacing: "1rem" },
  { value: "spacious", label: "Espaçado", spacing: "1.5rem" },
];

interface ThemeSettings {
  preset: ThemePreset;
  customColors: ThemeColors;
  fontFamily: string;
  density: "compact" | "normal" | "spacious";
  borderRadius: number;
  backgroundImage?: string;
}

export function ThemeCustomizer() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<ThemeSettings>({
    preset: "default",
    customColors: themePresets.default,
    fontFamily: "inter",
    density: "normal",
    borderRadius: 8,
  });

  const applyTheme = useCallback((newSettings: ThemeSettings) => {
    const root = document.documentElement;
    const currentTheme = resolvedTheme || "light";
    
    if (currentTheme === "light") {
      const colors = newSettings.preset === "default" 
        ? newSettings.customColors 
        : themePresets[newSettings.preset];
      
      root.style.setProperty("--primary", colors.primary);
      root.style.setProperty("--accent", colors.accent);
    }
    
    const fontMap: Record<string, string> = {
      inter: "Inter, system-ui, sans-serif",
      roboto: "'Roboto', system-ui, sans-serif",
      "open-sans": "'Open Sans', system-ui, sans-serif",
      lato: "'Lato', system-ui, sans-serif",
      montserrat: "'Montserrat', system-ui, sans-serif",
      poppins: "'Poppins', system-ui, sans-serif",
    };
    root.style.setProperty("--font-family", fontMap[newSettings.fontFamily] || fontMap.inter);
    
    const density = densityOptions.find(d => d.value === newSettings.density);
    if (density) {
      root.style.setProperty("--spacing-unit", density.spacing);
      document.body.style.setProperty("--spacing", density.spacing);
    }
    
    root.style.setProperty("--radius", `${newSettings.borderRadius}px`);
    
    if (newSettings.backgroundImage) {
      root.style.setProperty("--background-image", `url(${newSettings.backgroundImage})`);
      root.style.setProperty("--background-image-opacity", "0.05");
    } else {
      root.style.removeProperty("--background-image");
      root.style.removeProperty("--background-image-opacity");
    }
  }, [resolvedTheme]);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme-customization");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        applyTheme(parsed);
      } catch (e) {
        console.error("Erro ao carregar tema personalizado:", e);
      }
    }
  }, [applyTheme]);

  useEffect(() => {
    if (mounted) {
      applyTheme(settings);
    }
  }, [resolvedTheme, mounted, settings, applyTheme]);

  const handlePresetChange = (preset: ThemePreset) => {
    const newSettings = {
      ...settings,
      preset,
      customColors: themePresets[preset],
    };
    setSettings(newSettings);
    applyTheme(newSettings);
    saveSettings(newSettings);
  };

  const handleFontChange = (font: string) => {
    const newSettings = { ...settings, fontFamily: font };
    setSettings(newSettings);
    applyTheme(newSettings);
    saveSettings(newSettings);
  };

  const handleDensityChange = (density: "compact" | "normal" | "spacious") => {
    const newSettings = { ...settings, density };
    setSettings(newSettings);
    applyTheme(newSettings);
    saveSettings(newSettings);
  };

  const handleBorderRadiusChange = (value: number[]) => {
    const newSettings = { ...settings, borderRadius: value[0] };
    setSettings(newSettings);
    applyTheme(newSettings);
    saveSettings(newSettings);
  };

  const handleBackgroundImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        const newSettings = { ...settings, backgroundImage: imageUrl };
        setSettings(newSettings);
        applyTheme(newSettings);
        saveSettings(newSettings);
        toast.success("Imagem de fundo aplicada!");
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBackgroundImage = () => {
    const newSettings = { ...settings, backgroundImage: undefined };
    setSettings(newSettings);
    applyTheme(newSettings);
    saveSettings(newSettings);
    toast.success("Imagem de fundo removida!");
  };

  const saveSettings = (newSettings: ThemeSettings) => {
    localStorage.setItem("theme-customization", JSON.stringify(newSettings));
    try {
      fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema_customizacao: newSettings }),
      }).catch(() => {
      });
    } catch (e) {
    }
  };

  const resetTheme = () => {
    const defaultSettings: ThemeSettings = {
      preset: "default",
      customColors: themePresets.default,
      fontFamily: "inter",
      density: "normal",
      borderRadius: 8,
    };
    setSettings(defaultSettings);
    applyTheme(defaultSettings);
    saveSettings(defaultSettings);
    toast.success("Tema resetado para padrão!");
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Modo Escuro/Claro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Modo de Cores
          </CardTitle>
          <CardDescription>
            Escolha entre modo claro, escuro ou seguir as preferências do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => {
                setTheme("light");
                toast.success("Tema claro ativado");
              }}
              className={cn(
                "relative p-4 rounded-lg border-2 transition-all hover:shadow-md",
                theme === "light"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              )}
            >
              <div className="w-full h-20 rounded mb-3 overflow-hidden bg-gradient-to-br from-white via-gray-50 to-gray-100 border-2 border-gray-200">
                <div className="absolute inset-0 flex">
                  <div className="flex-1 bg-white"></div>
                  <div className="flex-1 bg-gray-50"></div>
                  <div className="flex-1 bg-gray-100"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-foreground" />
                  <span className="text-sm font-medium text-foreground">Claro</span>
                </div>
                {theme === "light" && <Check className="h-4 w-4 text-primary" />}
              </div>
            </button>

            <button
              onClick={() => {
                setTheme("dark");
                toast.success("Tema escuro ativado");
              }}
              className={cn(
                "relative p-4 rounded-lg border-2 transition-all hover:shadow-md",
                theme === "dark"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              )}
            >
              <div className="w-full h-20 rounded mb-3 overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-700 border-2 border-zinc-600">
                <div className="absolute inset-0 flex">
                  <div className="flex-1 bg-zinc-900"></div>
                  <div className="flex-1 bg-zinc-800"></div>
                  <div className="flex-1 bg-zinc-700"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-foreground" />
                  <span className="text-sm font-medium text-foreground">Escuro</span>
                </div>
                {theme === "dark" && <Check className="h-4 w-4 text-primary" />}
              </div>
            </button>

            <button
              onClick={() => {
                setTheme("system");
                toast.success("Tema do sistema ativado");
              }}
              className={cn(
                "relative p-4 rounded-lg border-2 transition-all hover:shadow-md",
                theme === "system"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              )}
            >
              <div className="w-full h-20 rounded mb-3 overflow-hidden relative bg-gradient-to-br from-white via-gray-100 to-zinc-900 border-2 border-gray-300">
                <div className="absolute inset-0 flex">
                  <div className="flex-1 bg-white"></div>
                  <div className="flex-1 bg-gray-100"></div>
                  <div className="flex-1 bg-zinc-900"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-foreground" />
                  <span className="text-sm font-medium text-foreground">Sistema</span>
                </div>
                {theme === "system" && <Check className="h-4 w-4 text-primary" />}
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Presets de Cores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Presets de Cores
          </CardTitle>
          <CardDescription>
            Escolha um esquema de cores pré-definido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {Object.entries(themePresets).map(([key, colors]) => (
              <button
                key={key}
                onClick={() => handlePresetChange(key as ThemePreset)}
                className={cn(
                  "relative p-4 rounded-lg border-2 transition-all hover:shadow-md",
                  settings.preset === key
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                )}
              >
                <div className="w-full h-16 rounded mb-2 overflow-hidden flex">
                  <div
                    className="flex-1"
                    style={{ backgroundColor: colors.primary }}
                  />
                  <div
                    className="flex-1"
                    style={{ backgroundColor: colors.secondary }}
                  />
                  <div
                    className="flex-1"
                    style={{ backgroundColor: colors.accent }}
                  />
                </div>
                <div className="text-xs font-medium capitalize text-center">
                  {key === "default" ? "Padrão" : key}
                </div>
                {settings.preset === key && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fonte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Fonte
          </CardTitle>
          <CardDescription>
            Escolha a fonte da interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={settings.fontFamily} onValueChange={handleFontChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontOptions.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: font.value === "inter" ? "Inter" : font.label.split(" ")[0] }}>
                    {font.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Densidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Densidade
          </CardTitle>
          <CardDescription>
            Ajuste o espaçamento entre elementos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {densityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleDensityChange(option.value as "compact" | "normal" | "spacious")}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all hover:shadow-md",
                  settings.density === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                )}
              >
                <div className="text-sm font-medium mb-2">{option.label}</div>
                <div className="space-y-1">
                  <div className="h-2 bg-primary/20 rounded"></div>
                  <div className="h-2 bg-primary/20 rounded"></div>
                  <div className="h-2 bg-primary/20 rounded"></div>
                </div>
                {settings.density === option.value && (
                  <div className="mt-2 flex justify-center">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Border Radius */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Arredondamento
          </CardTitle>
          <CardDescription>
            Ajuste o arredondamento dos cantos dos elementos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Raio de borda: {settings.borderRadius}px</Label>
            </div>
            <Slider
              value={[settings.borderRadius]}
              onValueChange={handleBorderRadiusChange}
              min={0}
              max={24}
              step={1}
              className="w-full"
            />
            <div className="flex gap-2 justify-center">
              <div
                className="w-16 h-16 bg-primary rounded"
                style={{ borderRadius: `${settings.borderRadius}px` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Background Image */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Imagem de Fundo
          </CardTitle>
          <CardDescription>
            Adicione uma imagem de fundo personalizada (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings.backgroundImage && (
              <div className="relative rounded-lg overflow-hidden border-2 border-border">
                <img
                  src={settings.backgroundImage}
                  alt="Background preview"
                  className="w-full h-32 object-cover opacity-50"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeBackgroundImage}
                >
                  Remover
                </Button>
              </div>
            )}
            <div>
              <Label htmlFor="background-image" className="cursor-pointer">
                <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors">
                  <div className="text-center">
                    <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {settings.backgroundImage ? "Trocar imagem" : "Adicionar imagem"}
                    </span>
                  </div>
                </div>
              </Label>
              <input
                id="background-image"
                type="file"
                accept="image/*"
                onChange={handleBackgroundImageChange}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset */}
      <Card>
        <CardContent className="pt-6">
          <Button variant="outline" onClick={resetTheme} className="w-full">
            Resetar para Padrão
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
