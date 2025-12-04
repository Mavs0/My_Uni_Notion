"use client";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./button";
export function ThemeToggle() {
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
  const getIcon = () => {
    if (theme === "system") {
      return <Monitor className="h-5 w-5" />;
    }
    return resolvedTheme === "dark" ? (
      <Sun className="h-5 w-5" />
    ) : (
      <Moon className="h-5 w-5" />
    );
  };
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      aria-label="Alternar tema"
      title={
        theme === "system"
          ? "Tema do sistema (clique para mudar)"
          : theme === "dark"
          ? "Tema escuro (clique para mudar)"
          : "Tema claro (clique para mudar)"
      }
    >
      {getIcon()}
    </Button>
  );
}