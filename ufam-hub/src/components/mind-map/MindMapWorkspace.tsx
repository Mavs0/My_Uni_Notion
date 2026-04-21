"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FolderOpen, Loader2, Network } from "lucide-react";
import { toast } from "sonner";
import type {
  MapaMentalData,
  MindMapLoadingStep,
  MindMapPhase,
  MindMapRefineAction,
} from "@/types/mind-map";
import { MM } from "@/lib/mind-map/mind-map-theme";
import { MOCK_MAPA_MENTAL } from "@/lib/mind-map/mock-map";
import { mkMindMapId } from "@/lib/mind-map/ids";
import {
  addRamo,
  addSubramo,
  ensureMapShape,
  mapToPlainContext,
  buildTopicoContext,
  removeRamo,
  removeSubramo,
  updateRamo,
  updateSubramo,
} from "@/lib/mind-map/map-helpers";
import {
  deactivateBibliotecaItem,
  extractPdfText,
  generateMindMap,
  listSavedMindMaps,
  refineMindMapText,
  saveMindMapToBiblioteca,
  updateMindMapBiblioteca,
  type BibliotecaItem,
} from "@/lib/mind-map/mind-map-api";
import { MindMapInputSection } from "./MindMapInputSection";
import { MindMapGenerateButton } from "./MindMapGenerateButton";
import { MindMapLoadingState } from "./MindMapLoadingState";
import { MindMapToolbar } from "./MindMapToolbar";
import { MindMapCanvas } from "./MindMapCanvas";
import { MindMapSummaryCard } from "./MindMapSummaryCard";
import { MindMapSidePanel } from "./MindMapSidePanel";
import { SaveMindMapDialog, type SaveMindMapMode } from "./SaveMindMapDialog";
import { SavedMindMapsModal } from "./SavedMindMapsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const RAMO_COLORS = ["#05865E", "#6366F1", "#F59E0B", "#EC4899", "#14B8A6", "#A855F7"];

type Props = {
  disciplinaId: string;
  disciplinaNome?: string | null;
};

function parseTags(s: string): string[] {
  return s
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function MindMapWorkspace({ disciplinaId, disciplinaNome }: Props) {
  const pdfRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<MindMapPhase>("input");
  const [loadingStep, setLoadingStep] = useState<MindMapLoadingStep>("analisando");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [inputTitulo, setInputTitulo] = useState("");
  const [inputTexto, setInputTexto] = useState("");
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [mapData, setMapData] = useState<MapaMentalData | null>(null);
  const [sourceText, setSourceText] = useState("");
  const [regenerating, setRegenerating] = useState(false);

  const [selectedRamoId, setSelectedRamoId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const [savedId, setSavedId] = useState<string | null>(null);

  const [iaBusy, setIaBusy] = useState(false);
  const [topicIaOut, setTopicIaOut] = useState<string | null>(null);
  const [globalIaOut, setGlobalIaOut] = useState<string | null>(null);

  const [resumoIaBusy, setResumoIaBusy] = useState(false);

  const [saveOpen, setSaveOpen] = useState(false);
  const [saveTitulo, setSaveTitulo] = useState("");
  const [saveTags, setSaveTags] = useState("");
  const [saveMode, setSaveMode] = useState<SaveMindMapMode>("novo");
  const [saveBusy, setSaveBusy] = useState(false);

  const [listOpen, setListOpen] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [listItems, setListItems] = useState<BibliotecaItem[]>([]);
  const [listBusyId, setListBusyId] = useState<string | null>(null);

  const mockMode =
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_MIND_MAP_MOCK === "1";

  useEffect(() => {
    if (phase !== "loading") return;
    const steps: MindMapLoadingStep[] = ["analisando", "estruturando", "relacoes"];
    let i = 0;
    const id = window.setInterval(() => {
      i = (i + 1) % steps.length;
      setLoadingStep(steps[i]!);
    }, 1200);
    return () => window.clearInterval(id);
  }, [phase]);

  const disabledInput = phase === "loading";

  const handlePdf = async (file: File | null) => {
    if (!file) return;
    setPdfName(file.name);
    setPdfLoading(true);
    setErrorMsg(null);
    try {
      const text = await extractPdfText(file);
      setInputTexto((prev) => (prev ? `${prev.trim()}\n\n${text}` : text));
      toast.success("Texto do PDF inserido no campo.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao ler PDF.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setPdfLoading(false);
      if (pdfRef.current) pdfRef.current.value = "";
    }
  };

  const runGenerate = useCallback(async () => {
    const trimmed = (sourceText.trim() || inputTexto.trim());
    if (!trimmed) {
      setErrorMsg("Adiciona texto ou um PDF para gerar o mapa.");
      return;
    }
    const fromResultView = phase === "result" && !!mapData;
    setErrorMsg(null);
    setGlobalIaOut(null);
    setTopicIaOut(null);

    if (fromResultView) {
      setRegenerating(true);
    } else {
      setPhase("loading");
      setLoadingStep("analisando");
      setMapData(null);
    }

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    try {
      if (mockMode) {
        await delay(1800);
        let m = ensureMapShape({ ...MOCK_MAPA_MENTAL });
        if (inputTitulo.trim()) m = { ...m, titulo: inputTitulo.trim() };
        setMapData(m);
        setSourceText(trimmed);
        setPhase("result");
        toast.success("Mapa de demonstração carregado.");
        return;
      }

      const raw = await generateMindMap({
        texto: trimmed,
        titulo: inputTitulo.trim() || undefined,
        disciplinaId: disciplinaId || undefined,
      });
      let m = ensureMapShape(raw);
      if (inputTitulo.trim()) m = { ...m, titulo: inputTitulo.trim() };
      setMapData(m);
      setSourceText(trimmed);
      setPhase("result");
      setSavedId(null);
      toast.success(
        fromResultView ? "Mapa regenerado." : "Mapa mental gerado."
      );
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Não foi possível gerar o mapa mental.";
      if (fromResultView) {
        toast.error(msg);
      } else {
        setErrorMsg(msg);
        setPhase("error");
        toast.error(msg);
      }
    } finally {
      if (fromResultView) setRegenerating(false);
    }
  }, [disciplinaId, inputTexto, inputTitulo, mapData, mockMode, phase, sourceText]);

  const selectedRamo = mapData?.ramos.find((r) => r.id === selectedRamoId) ?? null;

  const openSave = () => {
    if (!mapData) return;
    setSaveTitulo(mapData.titulo || inputTitulo || "Mapa mental");
    setSaveTags(
      savedId
        ? listItems.find((x) => x.id === savedId)?.tags?.join(", ") ?? ""
        : ""
    );
    setSaveMode(savedId ? "atualizar" : "novo");
    setSaveOpen(true);
  };

  const confirmSave = async () => {
    if (!mapData || !saveTitulo.trim()) return;
    setSaveBusy(true);
    try {
      const tags = parseTags(saveTags);
      const desc = mapData.descricao || mapData.resumo;
      if (saveMode === "atualizar" && savedId) {
        await updateMindMapBiblioteca(savedId, {
          titulo: saveTitulo.trim(),
          descricao: desc,
          tags: tags.length ? tags : undefined,
          conteudo: { ...mapData, titulo: saveTitulo.trim() },
        });
        toast.success("Mapa atualizado.");
      } else {
        const { id } = await saveMindMapToBiblioteca({
          titulo: saveTitulo.trim(),
          descricao: desc,
          tags,
          conteudo: { ...mapData, titulo: saveTitulo.trim() },
        });
        setSavedId(id);
        toast.success("Mapa guardado na biblioteca.");
      }
      setSaveOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao guardar.");
    } finally {
      setSaveBusy(false);
    }
  };

  const refreshList = async () => {
    setListLoading(true);
    try {
      const rows = await listSavedMindMaps();
      setListItems(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao listar mapas.");
    } finally {
      setListLoading(false);
    }
  };

  const openList = () => {
    setListOpen(true);
    void refreshList();
  };

  const loadBibliotecaItem = (item: BibliotecaItem) => {
    try {
      const raw = item.arquivo_url ? JSON.parse(item.arquivo_url) : null;
      if (!raw) throw new Error("Conteúdo inválido.");
      setMapData(ensureMapShape(raw as MapaMentalData));
      setSavedId(item.id);
      setSourceText("");
      setPhase("result");
      setListOpen(false);
      setSelectedRamoId(null);
      setPanelOpen(false);
      toast.success("Mapa carregado.");
    } catch {
      toast.error("Não foi possível ler este mapa.");
    }
  };

  const duplicateItem = async (item: BibliotecaItem) => {
    setListBusyId(item.id);
    try {
      const raw = item.arquivo_url ? JSON.parse(item.arquivo_url) : null;
      if (!raw) throw new Error("Conteúdo inválido.");
      const data = ensureMapShape(raw as MapaMentalData);
      const { id } = await saveMindMapToBiblioteca({
        titulo: `Cópia — ${item.titulo}`,
        descricao: data.descricao,
        tags: item.tags,
        conteudo: data,
      });
      toast.success("Mapa duplicado.");
      await refreshList();
      setSavedId(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao duplicar.");
    } finally {
      setListBusyId(null);
    }
  };

  const deleteItem = async (item: BibliotecaItem) => {
    if (!confirm("Remover este mapa da biblioteca?")) return;
    setListBusyId(item.id);
    try {
      await deactivateBibliotecaItem(item.id);
      toast.success("Mapa removido.");
      if (savedId === item.id) setSavedId(null);
      await refreshList();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover.");
    } finally {
      setListBusyId(null);
    }
  };

  const runTopicIa = async (action: MindMapRefineAction) => {
    if (!selectedRamo || !mapData) return;
    setIaBusy(true);
    setTopicIaOut(null);
    try {
      const text = await refineMindMapText({
        action,
        disciplinaNome: disciplinaNome ?? undefined,
        contextoTopico: buildTopicoContext(selectedRamo),
      });
      setTopicIaOut(text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro na IA.");
    } finally {
      setIaBusy(false);
    }
  };

  const runGlobalIa = async (action: MindMapRefineAction) => {
    if (!mapData) return;
    setIaBusy(true);
    setGlobalIaOut(null);
    try {
      const text = await refineMindMapText({
        action,
        disciplinaNome: disciplinaNome ?? undefined,
        contextoMapa: mapToPlainContext(mapData),
        resumoAtual: mapData.resumo,
      });
      setGlobalIaOut(text);
      if (action === "resumo_final") {
        setMapData((m) => (m ? { ...m, resumo: text } : m));
        toast.success("Resumo atualizado a partir da IA.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro na IA.");
    } finally {
      setIaBusy(false);
    }
  };

  const runResumoRegenerate = async () => {
    if (!mapData) return;
    setResumoIaBusy(true);
    try {
      const text = await refineMindMapText({
        action: "resumo_final",
        disciplinaNome: disciplinaNome ?? undefined,
        contextoMapa: mapToPlainContext(mapData),
        resumoAtual: mapData.resumo,
      });
      setMapData((m) => (m ? { ...m, resumo: text } : m));
      toast.success("Resumo regenerado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao regenerar resumo.");
    } finally {
      setResumoIaBusy(false);
    }
  };

  const newMap = () => {
    setPhase("input");
    setMapData(null);
    setErrorMsg(null);
    setSelectedRamoId(null);
    setPanelOpen(false);
    setSavedId(null);
    setGlobalIaOut(null);
    setTopicIaOut(null);
  };

  const updateMap = (patch: Partial<MapaMentalData>) => {
    setMapData((m) => (m ? { ...m, ...patch } : m));
  };

  const addManualRamo = () => {
    if (!mapData) return;
    const cor = RAMO_COLORS[mapData.ramos.length % RAMO_COLORS.length] ?? "#6366F1";
    setMapData(
      addRamo(mapData, {
        texto: "Novo tópico",
        cor,
        subramos: [],
      })
    );
  };

  return (
    <div className={cn("mx-auto max-w-5xl space-y-6", MM.page)}>
      <input
        ref={pdfRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => void handlePdf(e.target.files?.[0] ?? null)}
      />

      {(phase === "input" || phase === "loading" || phase === "error") && (
        <section
          className={cn(
            "rounded-2xl border border-violet-500/20 bg-gradient-to-b from-violet-500/[0.07] to-[#0a0a0a] p-6 shadow-xl",
            "ring-1 ring-white/[0.04]"
          )}
        >
          <header className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/25">
              <Network className="h-8 w-8 text-violet-400" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-[#F5F5F5]">
              Mapa mental
            </h2>
            <p className={cn("mx-auto mt-2 max-w-lg text-sm", MM.muted)}>
              Cole um texto, envia um PDF ou resume um documento para criar um mapa
              mental estruturado para estudo.
            </p>
          </header>

          <MindMapInputSection
            titulo={inputTitulo}
            texto={inputTexto}
            onTituloChange={setInputTitulo}
            onTextoChange={setInputTexto}
            disabled={disabledInput}
            pdfExtractLoading={pdfLoading}
            pdfFileName={pdfName}
            onPickPdf={() => pdfRef.current?.click()}
          />

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <MindMapGenerateButton
              loading={phase === "loading"}
              disabled={!inputTexto.trim()}
              onClick={() => void runGenerate()}
            />
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-12 shrink-0 rounded-xl border-[#262626] bg-[#121212] px-5 text-[#E5E5E5] hover:bg-[#1a1a1a]"
              onClick={openList}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Mapas guardados
            </Button>
          </div>

          {phase === "loading" ? (
            <div className="mt-8">
              <MindMapLoadingState step={loadingStep} />
            </div>
          ) : null}

          {errorMsg ? (
            <div
              className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              role="alert"
            >
              {errorMsg}
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-red-400/40 text-red-100"
                  onClick={() => {
                    setPhase("input");
                    setErrorMsg(null);
                  }}
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      )}

      {phase === "result" && mapData && (
        <div className="relative space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {regenerating ? (
            <div
              className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#050505]/75 backdrop-blur-sm"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-10 w-10 animate-spin text-[#05865E]" />
              <p className="text-sm text-[#A3A3A3]">A regenerar mapa…</p>
            </div>
          ) : null}
          <MindMapToolbar
            mapBusy={iaBusy || regenerating}
            disciplinaLabel={disciplinaNome}
            onSave={openSave}
            onOpenSaved={openList}
            onNewMap={newMap}
            onRegenerate={() => void runGenerate()}
            onGlobalIa={(a) => void runGlobalIa(a)}
          />

          {globalIaOut ? (
            <div className="rounded-2xl border border-[#262626] bg-[#101010] p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-[#F5F5F5]">
                  Sugestão da IA
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-[#A3A3A3]"
                  onClick={() => setGlobalIaOut(null)}
                >
                  Fechar
                </Button>
              </div>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-[#D4D4D4]">
                {globalIaOut}
              </pre>
            </div>
          ) : null}

          <div className="rounded-2xl border border-[#262626] bg-[#101010] p-5">
            <h3 className="text-lg font-semibold text-[#F5F5F5]">{mapData.titulo}</h3>
            <p className={cn("mt-1 text-sm", MM.muted)}>{mapData.descricao}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className={cn("mb-1 block text-xs", MM.muted)}>Título</label>
                <Input
                  value={mapData.titulo}
                  onChange={(e) => updateMap({ titulo: e.target.value })}
                  className="border-[#262626] bg-[#151515] text-[#F5F5F5]"
                />
              </div>
              <div>
                <label className={cn("mb-1 block text-xs", MM.muted)}>
                  Conceito central
                </label>
                <Input
                  value={mapData.nocentral.texto}
                  onChange={(e) =>
                    updateMap({
                      nocentral: { ...mapData.nocentral, texto: e.target.value },
                    })
                  }
                  className="border-[#262626] bg-[#151515] text-[#F5F5F5]"
                />
              </div>
              <div className="md:col-span-2">
                <label className={cn("mb-1 block text-xs", MM.muted)}>
                  Subtítulo / descrição curta
                </label>
                <Textarea
                  value={mapData.descricao}
                  onChange={(e) => updateMap({ descricao: e.target.value })}
                  rows={2}
                  className="border-[#262626] bg-[#151515] text-sm text-[#F5F5F5]"
                />
              </div>
            </div>
          </div>

          <MindMapCanvas
            data={mapData}
            selectedRamoId={selectedRamoId}
            onSelectRamo={(id) => {
              setSelectedRamoId(id);
              setPanelOpen(true);
            }}
            onOpenRamoPanel={(id) => {
              setSelectedRamoId(id);
              setPanelOpen(true);
            }}
          />

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addManualRamo}
              className="border-[#262626] bg-[#121212] text-[#E5E5E5]"
            >
              + Adicionar tópico manual
            </Button>
          </div>

          <MindMapSummaryCard
            value={mapData.resumo}
            onChange={(v) => updateMap({ resumo: v })}
            disabled={iaBusy}
            onRegenerateIa={() => void runResumoRegenerate()}
            regenerating={resumoIaBusy}
          />
        </div>
      )}

      <MindMapSidePanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        ramo={selectedRamo}
        iaLoading={iaBusy}
        iaOutput={topicIaOut}
        onUpdateRamo={(patch) => {
          if (!mapData || !selectedRamoId) return;
          setMapData(updateRamo(mapData, selectedRamoId, patch));
        }}
        onAddSubramo={() => {
          if (!mapData || !selectedRamoId) return;
          setMapData(
            addSubramo(mapData, selectedRamoId, {
              texto: "Subitem",
            })
          );
        }}
        onUpdateSubramo={(subId, patch) => {
          if (!mapData || !selectedRamoId) return;
          setMapData(updateSubramo(mapData, selectedRamoId, subId, patch));
        }}
        onRemoveSubramo={(subId) => {
          if (!mapData || !selectedRamoId) return;
          setMapData(removeSubramo(mapData, selectedRamoId, subId));
        }}
        onRemoveRamo={() => {
          if (!mapData || !selectedRamoId) return;
          if (!confirm("Remover este tópico?")) return;
          setMapData(removeRamo(mapData, selectedRamoId));
          setSelectedRamoId(null);
          setPanelOpen(false);
        }}
        onDuplicateRamo={() => {
          if (!mapData || !selectedRamo) return;
          const r = mapData.ramos.find((x) => x.id === selectedRamo.id);
          if (!r) return;
          const copy = {
            ...r,
            id: mkMindMapId("r"),
            texto: `${r.texto} (cópia)`,
            subramos: (r.subramos || []).map((s) => ({
              ...s,
              id: mkMindMapId("s"),
            })),
          };
          setMapData({ ...mapData, ramos: [...mapData.ramos, copy] });
          toast.success("Tópico duplicado.");
        }}
        onTopicIa={(a) => void runTopicIa(a)}
        onClearIaOutput={() => setTopicIaOut(null)}
      />

      <SaveMindMapDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        titulo={saveTitulo}
        onTituloChange={setSaveTitulo}
        tagsStr={saveTags}
        onTagsStrChange={setSaveTags}
        disciplinaNome={disciplinaNome}
        mode={saveMode}
        onModeChange={setSaveMode}
        canUpdate={!!savedId}
        saving={saveBusy}
        onConfirm={() => void confirmSave()}
      />

      <SavedMindMapsModal
        open={listOpen}
        onOpenChange={setListOpen}
        loading={listLoading}
        items={listItems}
        onOpenItem={loadBibliotecaItem}
        onDuplicateItem={(it) => void duplicateItem(it)}
        onDeleteItem={(it) => void deleteItem(it)}
        busyId={listBusyId}
      />
    </div>
  );
}
