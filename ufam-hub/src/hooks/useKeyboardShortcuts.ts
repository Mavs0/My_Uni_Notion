"use client";
import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Ignora se estiver em um input, textarea ou elemento editável
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        if (e.key !== "Escape") {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl
          ? e.ctrlKey || e.metaKey
          : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export function useGlobalShortcuts(callbacks?: {
  onSearch?: () => void;
  onNewDisciplina?: () => void;
  onNewAvaliacao?: () => void;
  onNewEvento?: () => void;
}) {
  const router = useRouter();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: "h",
      ctrl: true,
      description: "Ir para Dashboard",
      action: () => router.push("/dashboard"),
    },
    {
      key: "d",
      ctrl: true,
      shift: true,
      description: "Ir para Disciplinas",
      action: () => router.push("/disciplinas"),
    },
    {
      key: "a",
      ctrl: true,
      shift: true,
      description: "Ir para Avaliações",
      action: () => router.push("/avaliacoes"),
    },
    {
      key: "g",
      ctrl: true,
      shift: true,
      description: "Ir para Gamificação",
      action: () => router.push("/gamificacao"),
    },
    {
      key: "r",
      ctrl: true,
      shift: true,
      description: "Ir para Revisão",
      action: () => router.push("/revisao"),
    },
    {
      key: "n",
      ctrl: true,
      description: "Nova disciplina",
      action: () => {
        if (callbacks?.onNewDisciplina) {
          callbacks.onNewDisciplina();
        } else {
          router.push("/disciplinas?action=new");
        }
      },
    },
    {
      key: "n",
      ctrl: true,
      shift: true,
      description: "Nova avaliação",
      action: () => {
        if (callbacks?.onNewAvaliacao) {
          callbacks.onNewAvaliacao();
        } else {
          router.push("/avaliacoes?action=new");
        }
      },
    },
  ];

  useKeyboardShortcuts(shortcuts);
}

export const ALL_SHORTCUTS = [
  { keys: "⌘/Ctrl + K", description: "Busca rápida" },
  { keys: "⌘/Ctrl + H", description: "Ir para Dashboard" },
  { keys: "⌘/Ctrl + N", description: "Nova disciplina" },
  { keys: "⌘/Ctrl + Shift + N", description: "Nova avaliação" },
  { keys: "⌘/Ctrl + Shift + D", description: "Ir para Disciplinas" },
  { keys: "⌘/Ctrl + Shift + A", description: "Ir para Avaliações" },
  { keys: "⌘/Ctrl + Shift + G", description: "Ir para Gamificação" },
  { keys: "⌘/Ctrl + Shift + R", description: "Ir para Revisão" },
  { keys: "Escape", description: "Fechar modal/dialog" },
];
