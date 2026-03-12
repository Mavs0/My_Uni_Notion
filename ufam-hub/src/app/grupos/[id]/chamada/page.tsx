"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
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
    <main className="min-h-screen flex flex-col bg-background">
      <header className="shrink-0 h-12 flex items-center px-3 border-b border-border bg-background/95 backdrop-blur">
        <Button variant="ghost" size="sm" asChild className="shrink-0 -ml-1">
          <Link href={`/grupos/${grupoId}`}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Voltar ao grupo
          </Link>
        </Button>
        <h1 className="flex-1 text-center text-sm font-medium truncate px-2">Sala de chamada</h1>
        <div className="w-[88px] shrink-0" />
      </header>

      <div className="flex-1 min-h-0 flex flex-col" style={{ height: "calc(100vh - 3rem)" }}>
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
