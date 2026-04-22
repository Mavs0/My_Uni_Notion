"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Users,
  Globe,
  Plus,
  Filter,
  X as XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDisciplinas } from "@/hooks/useDisciplinasOptimized";
import { CreatePostComposerModal } from "@/components/feed/CreatePostComposerModal";
import { FeedMockShowcase } from "@/components/feed/FeedMockShowcase";
import { FeedRightSidebar } from "@/components/feed/FeedRightSidebar";

type FeedTab = "following" | "public";

function initialsFromNome(nome: string) {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  if (p.length === 1 && p[0].length >= 2) return p[0].slice(0, 2).toUpperCase();
  return nome.slice(0, 2).toUpperCase() || "?";
}

export default function FeedPage() {
  const [tab, setTab] = useState<FeedTab>("public");
  const [composerOpen, setComposerOpen] = useState(false);
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    tipoAtividade: "",
    disciplinaId: "",
    dataInicio: "",
    dataFim: "",
  });
  const [profile, setProfile] = useState({
    nome: "Você",
    avatar_url: "",
  });
  const { disciplinasAtivas } = useDisciplinas();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.profile) {
          setProfile({
            nome: data.profile.nome || "Você",
            avatar_url: data.profile.avatar_url || "",
          });
        }
      } catch {
        /* anon */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasActiveFilters =
    filters.tipoAtividade ||
    filters.disciplinaId ||
    filters.dataInicio ||
    filters.dataFim;

  const clearFilters = useCallback(() => {
    setFilters({
      tipoAtividade: "",
      disciplinaId: "",
      dataInicio: "",
      dataFim: "",
    });
  }, []);

  const userInitials = initialsFromNome(profile.nome);

  return (
    <main className="min-h-screen bg-[#F7F7F8] dark:bg-[#050505]">
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6">
        <div className="min-w-0 flex-1 space-y-8">
          <header className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-[#111827] dark:text-[#F5F5F5] sm:text-3xl">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#05865E]/15 text-[#05865E]">
                    <Activity className="h-6 w-6" />
                  </span>
                  Feed
                </h1>
                <p className="text-sm text-[#6B7280] dark:text-[#A3A3A3] sm:text-base">
                  Conquistas, dicas e reflexões da comunidade UFAM Hub
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-1">
                <Popover open={showFilters} onOpenChange={setShowFilters}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={hasActiveFilters ? "default" : "outline"}
                      className={cn(
                        "rounded-full border px-5",
                        !hasActiveFilters &&
                          "border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#FAFAFA] dark:border-[#262626] dark:bg-[#101010] dark:text-[#F5F5F5] dark:hover:bg-[#151515]",
                        hasActiveFilters &&
                          "border-[#05865E] bg-[#05865E] text-white hover:bg-[#047a52]",
                      )}
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Filtros
                      {hasActiveFilters ? (
                        <span className="ml-2 h-2 w-2 rounded-full bg-white/90" />
                      ) : null}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Filtros</h3>
                        {hasActiveFilters ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-8 text-xs"
                          >
                            <XIcon className="mr-1 h-3 w-3" />
                            Limpar
                          </Button>
                        ) : null}
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="tipo-atividade">Tipo de atividade</Label>
                          <Select
                            value={filters.tipoAtividade || undefined}
                            onValueChange={(value) =>
                              setFilters({
                                ...filters,
                                tipoAtividade: value || "",
                              })
                            }
                          >
                            <SelectTrigger id="tipo-atividade">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="criou_disciplina">
                                Criou disciplina
                              </SelectItem>
                              <SelectItem value="criou_avaliacao">
                                Criou avaliação
                              </SelectItem>
                              <SelectItem value="adicionou_nota">
                                Adicionou nota
                              </SelectItem>
                              <SelectItem value="completou_tarefa">
                                Completou tarefa
                              </SelectItem>
                              <SelectItem value="conquista_desbloqueada">
                                Conquista
                              </SelectItem>
                              <SelectItem value="post_personalizado">
                                Post personalizado
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="disciplina">Disciplina</Label>
                          <Select
                            value={filters.disciplinaId || undefined}
                            onValueChange={(value) =>
                              setFilters({
                                ...filters,
                                disciplinaId: value || "",
                              })
                            }
                          >
                            <SelectTrigger id="disciplina">
                              <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                              {disciplinasAtivas.map((disc) => (
                                <SelectItem key={disc.id} value={disc.id}>
                                  {disc.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="data-inicio">Data início</Label>
                          <Input
                            id="data-inicio"
                            type="date"
                            value={filters.dataInicio}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                dataInicio: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="data-fim">Data fim</Label>
                          <Input
                            id="data-fim"
                            type="date"
                            value={filters.dataFim}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                dataFim: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  type="button"
                  onClick={() => setComposerOpen(true)}
                  className="rounded-full bg-[#05865E] px-5 text-white shadow-md shadow-[#05865E]/20 hover:bg-[#047a52]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Publicar
                </Button>
              </div>
            </div>
          </header>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as FeedTab)}
            className="w-full"
          >
            <TabsList className="grid h-auto w-full max-w-md grid-cols-2 gap-1 rounded-2xl border border-[#E5E7EB] bg-white p-1.5 dark:border-[#262626] dark:bg-[#101010]">
              <TabsTrigger
                value="following"
                className="rounded-xl py-3 data-[state=active]:bg-[#05865E]/15 data-[state=active]:text-[#05865E] data-[state=active]:shadow-none dark:data-[state=active]:text-[#34D399]"
              >
                <Users className="mr-2 h-4 w-4 shrink-0" />
                Seguindo
              </TabsTrigger>
              <TabsTrigger
                value="public"
                className="rounded-xl py-3 data-[state=active]:bg-[#05865E]/15 data-[state=active]:text-[#05865E] data-[state=active]:shadow-none dark:data-[state=active]:text-[#34D399]"
              >
                <Globe className="mr-2 h-4 w-4 shrink-0" />
                Público
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="following"
              className="mt-6 space-y-8 focus-visible:outline-none"
            >
              <ActivityFeed
                type="following"
                filters={filters}
                refreshKey={feedRefreshKey}
              />
            </TabsContent>
            <TabsContent
              value="public"
              className="mt-6 space-y-8 focus-visible:outline-none"
            >
              <FeedMockShowcase />
              <ActivityFeed
                type="public"
                filters={filters}
                refreshKey={feedRefreshKey}
              />
            </TabsContent>
          </Tabs>
        </div>

        <FeedRightSidebar />
      </div>

      <CreatePostComposerModal
        open={composerOpen}
        onOpenChange={setComposerOpen}
        onPublished={() => setFeedRefreshKey((k) => k + 1)}
        userName={profile.nome}
        userAvatar={profile.avatar_url}
        userInitials={userInitials}
      />
    </main>
  );
}
