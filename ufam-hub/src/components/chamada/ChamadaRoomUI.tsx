"use client";

import * as React from "react";
import { RoomEvent, Track } from "livekit-client";
import {
  LayoutContextProvider,
  useCreateLayoutContext,
  useTracks,
  GridLayout,
  ParticipantTile,
  ControlBar,
  RoomAudioRenderer,
  ConnectionStateToast,
} from "@livekit/components-react";
import { ChamadaChatMeet } from "./ChamadaChatMeet";
import { cn } from "@/lib/utils";

function ChamadaRoomInner() {
  const layoutContext = useCreateLayoutContext();

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false },
  );

  return (
    <LayoutContextProvider value={layoutContext}>
      <div className="flex h-full flex-1 min-h-0 flex-col gap-3">
        {/* Área de vídeos + controles (ocupa o espaço disponível) */}
        <div className="flex flex-1 flex-col min-h-0 rounded-xl overflow-hidden border border-border bg-card">
          <div className="flex-1 min-h-0 overflow-hidden">
            <GridLayout tracks={tracks} className="h-full">
              <ParticipantTile />
            </GridLayout>
          </div>
          <div className="shrink-0 border-t border-border bg-muted/50 px-4 py-3">
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
              className="!gap-2 [&_button]:rounded-full [&_button]:h-11 [&_button]:w-11 [&_button[data-lk-source=disconnect]]:!bg-destructive [&_button[data-lk-source=disconnect]]:!text-destructive-foreground"
            />
          </div>
        </div>

        {/* Chat embaixo: estilo Google Meet */}
        <section className="shrink-0 flex flex-col min-h-[280px] max-h-[40vh] rounded-xl overflow-hidden border border-border bg-card">
          <ChamadaChatMeet />
        </section>
      </div>
      <RoomAudioRenderer />
      <ConnectionStateToast />
    </LayoutContextProvider>
  );
}

export function ChamadaRoomUI() {
  return (
    <div
      className={cn("chamada-room h-full w-full flex flex-col bg-background")}
    >
      <ChamadaRoomInner />
    </div>
  );
}
