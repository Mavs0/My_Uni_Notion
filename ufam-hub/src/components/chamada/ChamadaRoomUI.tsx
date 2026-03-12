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
  GridLayout,
  FocusLayoutContainer,
  FocusLayout,
  CarouselLayout,
  ParticipantTile,
  ControlBar,
  RoomAudioRenderer,
  ConnectionStateToast,
} from "@livekit/components-react";
import { ChamadaChatMeet } from "./ChamadaChatMeet";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, X } from "lucide-react";
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

function ChamadaRoomInner() {
  const layoutContext = useCreateLayoutContext();
  const pinnedTracks = usePinnedTracks(layoutContext);
  const focusTrack = pinnedTracks?.[0];
  const participants = useParticipants();
  const lastAutoFocusedScreenRef = React.useRef<TrackReferenceOrPlaceholder | null>(null);

  const [showChat, setShowChat] = React.useState(false);
  const [showPeople, setShowPeople] = React.useState(false);

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

  return (
    <LayoutContextProvider value={layoutContext}>
      <div className="flex h-full flex-col min-h-0 overflow-hidden bg-background chamada-meet-layout">
        {/* Área principal: vídeo + painéis laterais (estilo Meet) */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Conteúdo central: grid ou foco */}
          <div className="flex-1 min-h-0 flex flex-col min-w-0 overflow-hidden">
            {!focusTrack ? (
              <GridLayout tracks={tracks} className="h-full flex-1 min-h-0">
                <ParticipantTile />
              </GridLayout>
            ) : (
              <FocusLayoutContainer className="lk-focus-layout chamada-focus-layout h-full flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-2 p-2 overflow-hidden">
                  <div className="flex-1 min-h-0 rounded-lg overflow-hidden bg-muted/30 border border-border">
                    {focusTrack && <FocusLayout trackRef={focusTrack} />}
                  </div>
                  <div className="flex flex-row md:flex-col gap-2 shrink-0 md:w-40 lg:w-48 overflow-x-auto md:overflow-y-auto p-1">
                    <CarouselLayout
                      tracks={carouselTracks}
                      orientation="horizontal"
                      className="!flex !flex-row md:!flex-col !gap-2 !p-0"
                    >
                      <ParticipantTile />
                    </CarouselLayout>
                  </div>
                </div>
              </FocusLayoutContainer>
            )}
          </div>

          {/* Painel Pessoas (estilo Meet) */}
          {showPeople && (
            <aside className="chamada-sidebar chamada-sidebar-people w-72 shrink-0 border-l border-border bg-card flex flex-col">
              <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold">Pessoas</h2>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPeople(false)}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Fechar</span>
                </Button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                  Na chamada ({participants.length})
                </p>
                <ul className="space-y-0.5">
                  {participants.map((p) => (
                    <li
                      key={p.identity}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/60"
                    >
                      <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-sm font-medium text-primary shrink-0">
                        {(p.name || p.identity || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {p.isLocal ? "Você" : p.name || p.identity}
                        </p>
                        {p.isLocal && (
                          <p className="text-xs text-muted-foreground">Participante</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}

          {/* Painel Chat (estilo Meet) */}
          {showChat && (
            <aside className="chamada-sidebar chamada-sidebar-chat w-80 sm:w-96 shrink-0 border-l border-border bg-card flex flex-col min-h-0">
              <div className="shrink-0 flex items-center justify-end px-2 py-2 border-b border-border">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowChat(false)}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Fechar chat</span>
                </Button>
              </div>
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <ChamadaChatMeet />
              </div>
            </aside>
          )}
        </div>

        {/* Barra de controles estilo Google Meet */}
        <div className="chamada-control-bar shrink-0 flex items-center justify-between w-full px-4 py-3 bg-muted/90 dark:bg-zinc-900/95 border-t border-border">
          <div className="w-32 sm:w-40 shrink-0 flex items-center">
            <span className="text-xs sm:text-sm text-muted-foreground truncate">
              Sala de chamada
            </span>
          </div>
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <ControlBar
              variation="minimal"
              controls={{
                microphone: true,
                camera: true,
                screenShare: true,
                chat: false,
                leave: true,
                settings: false,
              }}
              className="!gap-1 sm:!gap-2 [&_button]:rounded-full [&_button]:h-11 [&_button]:w-11 [&_button[data-lk-source=disconnect]]:!bg-destructive [&_button[data-lk-source=disconnect]]:!text-destructive-foreground"
            />
          </div>
          <div className="w-32 sm:w-40 shrink-0 flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-11 w-11 rounded-full",
                showChat && "bg-muted"
              )}
              onClick={() => setShowChat((c) => !c)}
              title="Chat com todos"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="sr-only">Mensagens</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-11 w-11 rounded-full",
                showPeople && "bg-muted"
              )}
              onClick={() => setShowPeople((p) => !p)}
              title="Pessoas na chamada"
            >
              <Users className="h-5 w-5" />
              <span className="sr-only">Pessoas</span>
            </Button>
          </div>
        </div>
      </div>
      <RoomAudioRenderer />
      <ConnectionStateToast />
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
