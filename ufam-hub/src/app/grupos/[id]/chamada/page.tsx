"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { ArrowLeft, Video, Bell, MessageCircle, User } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import dynamic from "next/dynamic";
import "@livekit/components-styles";
import {
  ChamadaSidebarProvider,
  useChamadaSidebar,
} from "@/components/chamada/ChamadaSidebarContext";
import { ChamadaGroupInfoLoader } from "@/components/chamada/ChamadaGroupInfoLoader";
import { toast } from "sonner";

const LiveKitRoom = dynamic(
  () => import("@livekit/components-react").then((mod) => mod.LiveKitRoom),
  { ssr: false },
);

const ChamadaRoomUI = dynamic(
  () => import("@/components/chamada/ChamadaRoomUI").then((mod) => mod.ChamadaRoomUI),
  { ssr: false },
);

function formatSchedule() {
  const now = new Date();
  const end = new Date(now.getTime() + 60 * 60 * 1000);
  return `${now.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })} ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function GrupoChamadaPage() {
  const params = useParams();
  const router = useRouter();
  const grupoId = params.id as string;

  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchToken() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/chamada/token?room=${encodeURIComponent(grupoId)}`,
        );
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (!res.ok) {
          setError(data.error || "Não foi possível entrar na chamada.");
          setToken(null);
          setServerUrl(null);
          return;
        }

        if (!data.token || !data.url) {
          setError(
            "Chamadas em vídeo não estão configuradas. Configure LiveKit no servidor.",
          );
          setToken(null);
          setServerUrl(null);
          return;
        }

        setToken(data.token);
        setServerUrl(data.url);
      } catch (err) {
        if (!cancelled) {
          setError("Erro ao conectar. Tente novamente.");
          setToken(null);
          setServerUrl(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchToken();
    return () => {
      cancelled = true;
    };
  }, [grupoId]);

  const handleDisconnected = () => {
    router.push(`/grupos/${grupoId}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col items-center justify-center p-4">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Preparando a chamada...</p>
        <Button variant="ghost" size="sm" asChild className="mt-4">
          <Link href={`/grupos/${grupoId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao grupo
          </Link>
        </Button>
      </main>
    );
  }

  if (error || !token || !serverUrl) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4">
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-sm text-muted-foreground">
            Verifique se você é membro do grupo e se o LiveKit está configurado
            (LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL).
          </p>
        </div>
        <Button variant="secondary" asChild className="mt-6">
          <Link href={`/grupos/${grupoId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao grupo
          </Link>
        </Button>
      </main>
    );
  }

  return (
    <ChamadaSidebarProvider>
      <ChamadaGroupInfoLoader grupoId={grupoId} />
      <main className="chamada-v2 flex h-screen flex-col bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <ChamadaHeader grupoId={grupoId} />
        <div className="flex min-h-0 flex-1 flex-col">
          <LiveKitRoom
            token={token}
            serverUrl={serverUrl}
            connect={true}
            audio={true}
            video={true}
            onDisconnected={handleDisconnected}
            className="chamada-v2 h-full w-full chamada-room"
            data-lk-theme="default"
          >
            <ChamadaRoomUI />
          </LiveKitRoom>
        </div>
      </main>
    </ChamadaSidebarProvider>
  );
}

function formatHeaderElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function ChamadaHeader({ grupoId }: { grupoId: string }) {
  const { setSidebarTab, groupInfo, callElapsedMs } = useChamadaSidebar();
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200/90 bg-white px-4 py-3.5 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="h-10 w-10 shrink-0 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <Link href={`/grupos/${grupoId}`}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar ao grupo</span>
          </Link>
        </Button>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-500/30">
          <Video className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {groupInfo?.nome ?? "Chamada"}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">{formatSchedule()}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 md:gap-3">
        <div
          className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-slate-50 px-3 py-1.5 text-sm font-semibold tabular-nums text-slate-800 shadow-inner dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          title="Duração da chamada"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          {formatHeaderElapsed(callElapsedMs)}
        </div>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          title="Notificações"
          type="button"
          onClick={() => toast.info("Notificações da chamada em breve.")}
        >
          <Bell className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          title="Abrir chat"
          type="button"
          onClick={() => setSidebarTab("chat")}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          title="Participantes no painel direito"
          type="button"
          onClick={() =>
            toast.info("Participantes estão no cartão superior à direita.")
          }
        >
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
