"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

type User = { id: string; nome: string; avatar_url: string };

function iniciais(nome: string) {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return `${p[0]![0]}${p[p.length - 1]![0]}`.toUpperCase();
  return nome.slice(0, 2).toUpperCase() || "?";
}

export function GruposOnlineSidebar() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/colaboracao/rede-online", {
          credentials: "include",
        });
        const data = await res.json();
        if (!cancelled && res.ok) {
          setUsers(Array.isArray(data.users) ? data.users : []);
          setSource(typeof data.source === "string" ? data.source : null);
        }
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 90_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return (
    <aside
      className={cn(
        "flex max-h-[min(85vh,720px)] flex-col overflow-hidden rounded-3xl border border-white/10",
        "bg-gradient-to-b from-emerald-700 via-emerald-800 to-emerald-950",
        "text-white shadow-xl shadow-emerald-950/35",
        "dark:from-emerald-900 dark:via-emerald-950 dark:to-neutral-950 dark:border-emerald-800/40",
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/15 px-4 py-3.5 dark:border-white/10">
        <Radio className="h-4 w-4 shrink-0 text-emerald-300" />
        <h2 className="text-sm font-bold tracking-tight">Online agora</h2>
        <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-white/90">
          {loading ? "…" : users.length}
        </span>
      </div>
      <p className="px-4 pb-2 pt-1 text-[11px] leading-snug text-white/70 dark:text-emerald-100/75">
        {source === "atividade_recente"
          ? "Com base em atividade recente na rede."
          : "Colegas da comunidade para conectar."}
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-white/70" />
          </div>
        ) : users.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-white/75">
            Ninguém por aqui no momento. Volte mais tarde ou abra o feed.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {users.map((u, i) => (
              <li
                key={u.id}
                className="grupos-online-row"
                style={{
                  animationDelay: `${Math.min(i, 14) * 55}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <Link
                  href={`/perfil/${u.id}`}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-2.5 py-2 transition-all",
                    "hover:bg-white/15 hover:shadow-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                  )}
                >
                  <Avatar className="h-9 w-9 shrink-0 border border-white/20 shadow-sm">
                    {u.avatar_url ? (
                      <AvatarImage src={u.avatar_url} alt="" className="object-cover" />
                    ) : null}
                    <AvatarFallback className="bg-white/20 text-[11px] font-semibold text-white">
                      {iniciais(u.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                    {u.nome}
                  </span>
                  <span
                    className="online-dot-animate h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_0_2px_rgba(255,255,255,0.25)]"
                    title="Ativo"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
