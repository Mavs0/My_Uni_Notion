"use client";

import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { useRouter } from "next/navigation";

export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  return { open, setOpen };
}

export function CommandPalette({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const router = useRouter();
  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar ações e páginas..." />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>
        <CommandGroup heading="Navegação">
          <CommandItem onSelect={() => go("/dashboard")}>Dashboard</CommandItem>
          <CommandItem onSelect={() => go("/disciplinas")}>
            Disciplinas
          </CommandItem>
          <CommandItem onSelect={() => go("/avaliacoes")}>
            Avaliações
          </CommandItem>
          <CommandItem onSelect={() => go("/grade")}>Grade</CommandItem>
          <CommandItem onSelect={() => go("/chat")}>Chat IA</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Ações">
          <CommandItem onSelect={() => go("/avaliacoes/nova")}>
            Nova avaliação
          </CommandItem>
          <CommandItem onSelect={() => go("/disciplinas/nova")}>
            Nova disciplina
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
