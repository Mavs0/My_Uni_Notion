"use client";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "default" | "floating";
}

export function ThemeToggle({ variant = "default" }: ThemeToggleProps) {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
      saveThemePreference("dark");
    } else if (theme === "dark") {
      setTheme("system");
      saveThemePreference("system");
    } else {
      setTheme("light");
      saveThemePreference("light");
    }
  };
  const saveThemePreference = async (newTheme: string) => {
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema_preferencia: newTheme }),
      });
    } catch (error) {
      console.error("Erro ao salvar preferência de tema:", error);
    }
  };
  const iconSize = variant === "floating" ? "h-6 w-6" : "h-5 w-5";
  const getIcon = () => {
    if (theme === "system") {
      return <Monitor className={iconSize} />;
    }
    return resolvedTheme === "dark" ? (
      <Sun className={iconSize} />
    ) : (
      <Moon className={iconSize} />
    );
  };
  return (
    <Button
      variant={variant === "floating" ? "default" : "ghost"}
      size={variant === "floating" ? "lg" : "icon"}
      onClick={cycleTheme}
      aria-label="Alternar tema"
      title={
        theme === "system"
          ? "Tema do sistema (clique para mudar)"
          : theme === "dark"
            ? "Tema escuro (clique para mudar)"
            : "Tema claro (clique para mudar)"
      }
      className={cn(
        variant === "floating" && "h-14 w-14 rounded-full shadow-lg p-0",
      )}
    >
      {getIcon()}
    </Button>
  );
}
