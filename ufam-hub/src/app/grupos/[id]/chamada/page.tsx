"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { ArrowLeft, Video, Bell, MessageCircle, User } from "lucide-react";
import dynamic from "next/dynamic";
import "@livekit/components-styles";

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
  const [grupoNome, setGrupoNome] = useState<string>("");

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

  useEffect(() => {
    if (!grupoId || !token) return;
    let cancelled = false;
    fetch(`/api/colaboracao/grupos/${grupoId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.nome) setGrupoNome(data.nome);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [grupoId, token]);

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
    <main className="flex h-screen flex-col bg-background">
      {/* Top bar — título da reunião, horário, ícones e avatar (estilo anexos) */}
      <header className="shrink-0 flex items-center justify-between gap-4 border-b border-border bg-background px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9 shrink-0 rounded-lg">
            <Link href={`/grupos/${grupoId}`}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Voltar ao grupo</span>
            </Link>
          </Button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Video className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-foreground">
              {grupoNome || "Chamada"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {formatSchedule()}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" title="Notificações">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" title="Chat">
            <MessageCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" title="Participantes">
            <User className="h-5 w-5" />
          </Button>
          <div className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
            ?
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <LiveKitRoom
          token={token}
          serverUrl={serverUrl}
          connect={true}
          audio={true}
          video={true}
          onDisconnected={handleDisconnected}
          className="h-full w-full chamada-room"
          data-lk-theme="default"
        >
          <ChamadaRoomUI />
        </LiveKitRoom>
      </div>
    </main>
  );
}
