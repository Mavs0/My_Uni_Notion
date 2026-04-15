"use client";

import * as React from "react";
import { RoomEvent, Track, type RemoteParticipant } from "livekit-client";
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
import {
  useChamadaSidebar,
  type ChamadaSidebarTab,
} from "./ChamadaSidebarContext";
import { ChamadaShareModal } from "./ChamadaShareModal";
import {
  MessageCircle,
  Activity,
  Mic,
  MicOff,
  Video,
  VideoOff,
  UserPlus,
  LayoutGrid,
  Users,
  Volume2,
} from "lucide-react";
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
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function ChamadaRoomInner() {
  const layoutContext = useCreateLayoutContext();
  const pinnedTracks = usePinnedTracks(layoutContext);
  const focusTrack = pinnedTracks?.[0];
  const participants = useParticipants();
  const room = useRoomContext();
  const lastAutoFocusedScreenRef = React.useRef<TrackReferenceOrPlaceholder | null>(null);

  const {
    sidebarTab,
    setSidebarTab,
    groupInfo,
    shareModalOpen,
    setShareModalOpen,
    callElapsedMs,
    setCallElapsedMs,
  } = useChamadaSidebar();
  const startTimeRef = React.useRef<number>(Date.now());
  /** Volume de reprodução dos participantes remotos (0–1). Não altera o volume do SO. */
  const [playbackVolume, setPlaybackVolume] = React.useState(1);

  const applyPlaybackVolumeToRemotes = React.useCallback(
    (volume: number) => {
      room.remoteParticipants.forEach((p: RemoteParticipant) => {
        try {
          p.setVolume(volume);
          p.setVolume(volume, Track.Source.ScreenShareAudio);
        } catch {
          /* ignore */
        }
      });
    },
    [room],
  );

  React.useEffect(() => {
    applyPlaybackVolumeToRemotes(playbackVolume);
  }, [playbackVolume, applyPlaybackVolumeToRemotes]);

  React.useEffect(() => {
    const onParticipant = () => applyPlaybackVolumeToRemotes(playbackVolume);
    room.on(RoomEvent.ParticipantConnected, onParticipant);
    return () => {
      room.off(RoomEvent.ParticipantConnected, onParticipant);
    };
  }, [room, playbackVolume, applyPlaybackVolumeToRemotes]);

  React.useEffect(() => {
    startTimeRef.current = Date.now();
    setCallElapsedMs(0);
    const t = setInterval(() => {
      setCallElapsedMs(Date.now() - startTimeRef.current);
    }, 1000);
    return () => clearInterval(t);
  }, [setCallElapsedMs]);

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
    { id: "chat", label: "Chat", icon: <MessageCircle className="h-3.5 w-3.5" /> },
    { id: "transcricao", label: "Momentos", icon: null },
    { id: "atividade", label: "Atividade", icon: <Activity className="h-3.5 w-3.5" /> },
  ];

  return (
    <LayoutContextProvider value={layoutContext}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-100 text-slate-900 chamada-meet-layout chamada-meeting-surface dark:bg-slate-950 dark:text-slate-100">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Área principal de vídeo */}
          <div className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-3 md:p-5">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700/90 dark:bg-slate-900 dark:ring-slate-800/80">
            {!focusTrack ? (
              <GridLayout tracks={tracks} className="h-full min-h-0 flex-1 chamada-grid-v2">
                <ParticipantTile />
              </GridLayout>
            ) : (
              <FocusLayoutContainer className="lk-focus-layout chamada-focus-layout flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 md:p-4">
                  <div className="chamada-focus-main flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-100 bg-slate-50 shadow-inner dark:border-slate-700 dark:bg-slate-800/50">
                    {focusTrack && <FocusLayout trackRef={focusTrack} />}
                  </div>
                  <div className="shrink-0 flex flex-row gap-2 overflow-x-auto overflow-y-hidden py-1 px-0 min-h-[112px] max-h-[168px] md:min-h-[128px] md:max-h-[176px]">
                    <CarouselLayout
                      tracks={carouselTracks}
                      orientation="horizontal"
                      className="!flex !flex-row !gap-3 !p-0 !min-h-0"
                    >
                      <ParticipantTile />
                    </CarouselLayout>
                  </div>
                </div>
              </FocusLayoutContainer>
            )}
            </div>
          </div>

          {/* Sidebar: cartões empilhados */}
          <aside className="chamada-sidebar pointer-events-auto relative z-[40] flex w-full max-w-sm shrink-0 flex-col gap-4 overflow-y-auto bg-slate-100 p-3 md:max-w-none md:p-4 lg:w-[400px] dark:bg-slate-950">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-md shadow-slate-900/5 ring-1 ring-slate-900/[0.04] dark:border-slate-700/90 dark:bg-slate-900 dark:shadow-slate-950/50 dark:ring-slate-800/60">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
                  Participantes
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-full border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  onClick={() => setShareModalOpen(true)}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>
              <ul className="mt-3 max-h-36 space-y-1 overflow-y-auto pr-1">
                {participants.map((p) => (
                  <li
                    key={p.identity}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300">
                      {(p.name || p.identity || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {p.isLocal ? "Você" : p.name || p.identity}
                      </p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400">
                        Participante
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {p.isMicrophoneEnabled ? (
                        <Mic className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <MicOff className="h-4 w-4 text-slate-500 dark:text-slate-500" />
                      )}
                      {p.isCameraEnabled ? (
                        <Video className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <VideoOff className="h-4 w-4 text-slate-500 dark:text-slate-500" />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-900/5 ring-1 ring-slate-900/[0.04] dark:border-slate-700/90 dark:bg-slate-900 dark:shadow-slate-950/50 dark:ring-slate-800/60">
              <div className="flex shrink-0 gap-1 border-b border-slate-100 p-2 dark:border-slate-700">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSidebarTab(tab.id)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-colors",
                      sidebarTab === tab.id
                        ? "bg-emerald-500/15 text-emerald-800 shadow-sm dark:bg-emerald-500/20 dark:text-emerald-300"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-slate-900">
                {sidebarTab === "chat" && (
                  <div className="flex h-full min-h-0 flex-col">
                    <ChamadaChatMeet />
                  </div>
                )}
                {sidebarTab === "transcricao" && <ChamadaTranscricao />}
                {sidebarTab === "atividade" && <ChamadaAtividade />}
              </div>
            </div>
          </aside>
        </div>

        {/* Barra de controles: volume (áudio remoto) · ações · sair */}
        <div className="chamada-control-bar relative z-[35] flex w-full flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-white px-4 py-4 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900 md:px-8">
          <div className="flex min-w-0 max-w-[220px] flex-1 items-center gap-3 sm:min-w-[160px] sm:max-w-none sm:flex-initial">
            <Volume2
              className="h-5 w-5 shrink-0 text-slate-600 dark:text-slate-300"
              aria-hidden
            />
            <label className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-[140px]">
              <span className="sr-only">Volume dos outros participantes na chamada</span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(playbackVolume * 100)}
                onChange={(e) =>
                  setPlaybackVolume(Number(e.target.value) / 100)
                }
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-emerald-600 dark:bg-slate-600 dark:accent-emerald-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-600 dark:[&::-webkit-slider-thumb]:bg-emerald-400"
                title="Volume do áudio dos outros (não é o volume do sistema)"
              />
            </label>
            <div className="flex items-center gap-2 sm:hidden">
              <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-800 dark:bg-slate-700 dark:text-slate-100">
                N
              </span>
              <span className="text-xs font-medium tabular-nums text-slate-800 dark:text-slate-200">
                {formatElapsed(callElapsedMs)}
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-center gap-2 md:gap-3">
            <TrackToggle
              source={Track.Source.Microphone}
              title="Microfone"
              className={cn(
                "h-12 w-12 shrink-0 rounded-full border-2 border-slate-200 bg-slate-50 shadow-sm dark:border-slate-600 dark:bg-slate-800",
                "text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-700",
                "aria-[pressed=true]:border-emerald-500 aria-[pressed=true]:bg-emerald-50 dark:aria-[pressed=true]:bg-emerald-950/40",
              )}
            />
            <TrackToggle
              source={Track.Source.Camera}
              title="Câmera"
              className={cn(
                "h-12 w-12 shrink-0 rounded-full border-2 border-slate-200 bg-slate-50 shadow-sm dark:border-slate-600 dark:bg-slate-800",
                "text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-700",
                "aria-[pressed=true]:border-emerald-500 aria-[pressed=true]:bg-emerald-50 dark:aria-[pressed=true]:bg-emerald-950/40",
              )}
            />
            <TrackToggle
              source={Track.Source.ScreenShare}
              title="Compartilhar tela"
              className={cn(
                "h-12 w-12 shrink-0 rounded-full border-2 border-slate-200 bg-slate-50 shadow-sm dark:border-slate-600 dark:bg-slate-800",
                "text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-700",
                "aria-[pressed=true]:border-emerald-500 aria-[pressed=true]:bg-emerald-50 dark:aria-[pressed=true]:bg-emerald-950/40",
              )}
            />
            {focusTrack ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12 shrink-0 rounded-full border-slate-200 bg-slate-50 text-slate-800 shadow-sm hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                title="Voltar à grelha de participantes"
                onClick={() => layoutContext.pin.dispatch?.({ msg: "clear_pin" })}
              >
                <LayoutGrid className="h-5 w-5" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-12 w-12 shrink-0 rounded-full border-slate-200 bg-slate-50 text-slate-800 shadow-sm hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              title="Convidar e participantes"
              onClick={() => setShareModalOpen(true)}
            >
              <Users className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex min-w-[140px] flex-wrap items-center justify-end gap-3">
            <Button
              variant="destructive"
              size="sm"
              className="h-11 shrink-0 rounded-xl px-6 font-semibold shadow-sm dark:bg-red-600 dark:text-white dark:hover:bg-red-700"
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
    <div className="chamada-room chamada-meeting-surface flex h-full w-full flex-col bg-slate-100 dark:bg-slate-950">
      <ChamadaRoomInner />
    </div>
  );
}
