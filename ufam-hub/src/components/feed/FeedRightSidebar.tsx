"use client";

import { Zap, Eye, Shield, Sparkles } from "lucide-react";

const items = [
  {
    icon: Zap,
    title: "Rápido e prático",
    text: "Publique em segundos sem sair do fluxo de estudo.",
  },
  {
    icon: Eye,
    title: "Preview em tempo real",
    text: "Veja como o post aparece antes de enviar.",
  },
  {
    icon: Shield,
    title: "Ambiente seguro",
    text: "Denúncias e moderação ajudam a manter o respeito.",
  },
  {
    icon: Sparkles,
    title: "Dicas inteligentes",
    text: "Sugestões para inspirar a sua próxima publicação.",
  },
] as const;

export function FeedRightSidebar() {
  return (
    <aside className="hidden w-full max-w-xs shrink-0 space-y-3 xl:block">
      {items.map(({ icon: Icon, title, text }) => (
        <div
          key={title}
          className="rounded-2xl border border-[#E5E7EB] bg-white p-4 dark:border-[#262626] dark:bg-[#101010]"
        >
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#05865E]/10 text-[#05865E]">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111827] dark:text-[#F5F5F5]">
                {title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#6B7280] dark:text-[#A3A3A3]">
                {text}
              </p>
            </div>
          </div>
        </div>
      ))}
    </aside>
  );
}
