"use client";

import * as React from "react";
import { RoomEvent, Track } from "livekit-client";
import type { TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { isTrackReference } from "@livekit/components-react";
import {
  LayoutContextProvider,
  useCreateLayoutContext,
  useTracks,
  usePinnedTracks,
  useParticipants,
  useRoomContext,
  GridLayout,
  FocusLayoutContainer,
  FocusLayout,
  CarouselLayout,
  ParticipantTile,
  TrackToggle,
  RoomAudioRenderer,
  ConnectionStateToast,
} from "@livekit/components-react";
import { ChamadaChatMeet } from "./ChamadaChatMeet";
import { ChamadaTranscricao } from "./ChamadaTranscricao";
import { ChamadaAtividade } from "./ChamadaAtividade";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useChamadaSidebar,
  type ChamadaSidebarTab,
} from "./ChamadaSidebarContext";
import { ChamadaShareModal } from "./ChamadaShareModal";
import { MessageCircle, Activity, Mic, MicOff, Video, VideoOff, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

function isSameTrack(
  a: TrackReferenceOrPlaceholder,
  b: TrackReferenceOrPlaceholder
): boolean {
  if (!a || !b) return false;
  const aPub = "publication" in a ? a.publication : null;
  const bPub = "publication" in b ? b.publication : null;
  if (a.participant?.identity !== b.participant?.identity) return false;
  const aSource = "source" in a ? a.source : (aPub as any)?.source;
  const bSource = "source" in b ? b.source : (bPub as any)?.source;
  if (aSource !== bSource) return false;
  if (aPub?.trackSid && bPub?.trackSid && aPub.trackSid !== bPub.trackSid)
    return false;
  return true;
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function ChamadaRoomInner() {
  const layoutContext = useCreateLayoutContext();
  const pinnedTracks = usePinnedTracks(layoutContext);
  const focusTrack = pinnedTracks?.[0];
  const participants = useParticipants();
  const room = useRoomContext();
  const lastAutoFocusedScreenRef = React.useRef<TrackReferenceOrPlaceholder | null>(null);

  const { sidebarTab, setSidebarTab, groupInfo, shareModalOpen, setShareModalOpen } = useChamadaSidebar();
  const [elapsedMs, setElapsedMs] = React.useState(0);
  const startTimeRef = React.useRef<number>(Date.now());

  React.useEffect(() => {
    const t = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false }
  );

  const carouselTracks = focusTrack
    ? tracks.filter((t) => !isSameTrack(t, focusTrack))
    : tracks;

  const screenShareTracks = tracks.filter(
    (t) => isTrackReference(t) && t.publication?.source === Track.Source.ScreenShare
  );
  const hasActiveScreenShare = screenShareTracks.some((t) => (t as any).publication?.isSubscribed);

  React.useEffect(() => {
    if (hasActiveScreenShare && screenShareTracks[0] && lastAutoFocusedScreenRef.current === null) {
      layoutContext.pin.dispatch?.({ msg: "set_pin", trackReference: screenShareTracks[0] });
      lastAutoFocusedScreenRef.current = screenShareTracks[0];
    } else if (
      lastAutoFocusedScreenRef.current &&
      !screenShareTracks.some(
        (t) =>
          (t as any).publication?.trackSid ===
          (lastAutoFocusedScreenRef.current as any)?.publication?.trackSid
      )
    ) {
      layoutContext.pin.dispatch?.({ msg: "clear_pin" });
      lastAutoFocusedScreenRef.current = null;
    }
  }, [
    hasActiveScreenShare,
    screenShareTracks.map((t) => (t as any).publication?.trackSid).join(","),
    focusTrack?.publication?.trackSid,
  ]);

  const tabs: { id: ChamadaSidebarTab; label: string; icon: React.ReactNode }[] = [
    { id: "chat", label: "Chat", icon: <MessageCircle className="h-4 w-4" /> },
    { id: "transcricao", label: "Transcrição", icon: null },
    { id: "atividade", label: "Atividade", icon: <Activity className="h-4 w-4" /> },
  ];

  return (
    <LayoutContextProvider value={layoutContext}>
      <div className="flex h-full flex-col min-h-0 overflow-hidden bg-background chamada-meet-layout">
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Área de vídeo (cerca de 2/3) */}
          <div className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {!focusTrack ? (
              <GridLayout tracks={tracks} className="h-full flex-1 min-h-0">
                <ParticipantTile />
              </GridLayout>
            ) : (
              /* Estilo Meet: tela grande em cima, participantes embaixo */
              <FocusLayoutContainer className="lk-focus-layout chamada-focus-layout h-full flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex flex-1 min-h-0 flex flex-col gap-2 p-2 overflow-hidden">
                  {/* Área principal em cima: tela compartilhada ou vídeo em foco */}
                  <div className="chamada-focus-main flex-1 min-h-0 rounded-lg overflow-hidden bg-muted/30 border border-border flex flex-col">
                    {focusTrack && <FocusLayout trackRef={focusTrack} />}
                  </div>
                  {/* Faixa de participantes embaixo (quem não está apresentando) */}
                  <div className="shrink-0 flex flex-row gap-2 overflow-x-auto overflow-y-hidden py-1 px-1 min-h-[120px] max-h-[180px]">
                    <CarouselLayout
                      tracks={carouselTracks}
                      orientation="horizontal"
                      className="!flex !flex-row !gap-2 !p-0 !min-h-0"
                    >
                      <ParticipantTile />
                    </CarouselLayout>
                  </div>
                </div>
              </FocusLayoutContainer>
            )}
          </div>

          {/* Sidebar direita unificada: Participantes + abas (Chat, Transcrição, Atividade) */}
          <aside className="chamada-sidebar relative z-[40] flex w-full max-w-sm flex-col border-l border-border bg-card shrink-0 pointer-events-auto md:w-[340px] lg:w-[380px]">
            <div className="shrink-0 border-b border-border px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Participantes
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 rounded-lg text-xs shrink-0"
                  onClick={() => setShareModalOpen(true)}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Adicionar +
                </Button>
              </div>
              <ul className="mt-3 space-y-1 max-h-32 overflow-y-auto">
                {participants.map((p) => (
                  <li
                    key={p.identity}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50"
                  >
                    <div className="h-8 w-8 shrink-0 rounded-full bg-primary/15 flex items-center justify-center text-xs font-medium text-primary">
                      {(p.name || p.identity || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {p.isLocal ? "Você" : p.name || p.identity}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {p.isLocal ? "Participante" : "Participante"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {p.isMicrophoneEnabled ? (
                        <Mic className="h-4 w-4 text-primary" />
                      ) : (
                        <MicOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      {p.isCameraEnabled ? (
                        <Video className="h-4 w-4 text-primary" />
                      ) : (
                        <VideoOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Abas: Chat | Transcrição | Atividade */}
            <div className="shrink-0 flex border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSidebarTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors",
                    sidebarTab === tab.id
                      ? "border-b-2 border-primary text-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {sidebarTab === "chat" && (
                <div className="flex flex-col h-full min-h-0">
                  <ChamadaChatMeet />
                </div>
              )}
              {sidebarTab === "transcricao" && (
                <ChamadaTranscricao />
              )}
              {sidebarTab === "atividade" && (
                <ChamadaAtividade />
              )}
            </div>
          </aside>
        </div>

        {/* Barra inferior: mic / câmera / tela sempre visíveis + timer e encerrar */}
        <div className="chamada-control-bar relative z-[35] flex w-full flex-col gap-3 border-t border-border bg-muted/90 px-4 py-3 dark:bg-zinc-900/95">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <TrackToggle
              source={Track.Source.Microphone}
              title="Microfone"
              className={cn(
                "h-12 w-12 shrink-0 rounded-full border-2 border-border bg-card shadow-sm",
                "text-foreground hover:bg-muted aria-[pressed=true]:border-primary aria-[pressed=true]:bg-primary/15"
              )}
            />
            <TrackToggle
              source={Track.Source.Camera}
              title="Câmera"
              className={cn(
                "h-12 w-12 shrink-0 rounded-full border-2 border-border bg-card shadow-sm",
                "text-foreground hover:bg-muted aria-[pressed=true]:border-primary aria-[pressed=true]:bg-primary/15"
              )}
            />
            <TrackToggle
              source={Track.Source.ScreenShare}
              title="Compartilhar tela"
              className={cn(
                "h-12 w-12 shrink-0 rounded-full border-2 border-border bg-card shadow-sm",
                "text-foreground hover:bg-muted aria-[pressed=true]:border-primary aria-[pressed=true]:bg-primary/15"
              )}
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-sm font-medium tabular-nums text-foreground">
                {formatElapsed(elapsedMs)}
              </span>
              <span className="text-xs text-muted-foreground">/ 1:00:00</span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="h-11 shrink-0 rounded-lg px-4 font-medium"
              type="button"
              onClick={() => room.disconnect()}
            >
              Encerrar chamada
            </Button>
          </div>
        </div>
      </div>
      <RoomAudioRenderer />
      <ConnectionStateToast />
      <ChamadaShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        groupInfo={groupInfo}
      />
    </LayoutContextProvider>
  );
}

export function ChamadaRoomUI() {
  return (
    <div className="chamada-room h-full w-full flex flex-col bg-background">
      <ChamadaRoomInner />
    </div>
  );
}
