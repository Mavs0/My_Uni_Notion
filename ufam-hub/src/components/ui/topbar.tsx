"use client";

import Link from "next/link";
import { Input } from "./input";
import { Button } from "./button";
import { Separator } from "./separator";
import { Avatar, AvatarFallback } from "./avatar";
import { ThemeToggle } from "./theme-toggle";
import { Command, Search } from "lucide-react";
import * as React from "react";
import { useCommandPalette, CommandPalette } from "./command-palette";

export default function TopBar() {
  const { open, setOpen } = useCommandPalette();
  const [q, setQ] = React.useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: redirecionar para página de busca com q
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href="/dashboard" className="text-sm font-semibold">
            UFAM Hub
          </Link>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <form
            onSubmit={submit}
            className="relative hidden flex-1 items-center md:flex"
          >
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar notas, disciplinas, avaliações..."
              className="pl-9"
            />
          </form>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setOpen(true)}
          >
            <Command className="h-4 w-4" />
            <span className="hidden sm:inline">Comandos</span>
            <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground sm:flex">
              ⌘K
            </kbd>
          </Button>
          <ThemeToggle />
          <Avatar className="h-8 w-8">
            <AvatarFallback>MV</AvatarFallback>
          </Avatar>
        </div>
      </header>
      <CommandPalette open={open} setOpen={setOpen} />
    </>
  );
}
