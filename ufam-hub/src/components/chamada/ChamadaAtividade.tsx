"use client";

import * as React from "react";
import { Track } from "livekit-client";
import {
  useParticipants,
  useSpeakingParticipants,
  useTracks,
} from "@livekit/components-react";
import { Mic, Monitor, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChamadaAtividade() {
  const participants = useParticipants();
  const speakingParticipants = useSpeakingParticipants();
  const screenShareTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: true }
  );

  const whoIsSharing = React.useMemo(() => {
    const subs = screenShareTracks.filter(
      (t) => "publication" in t && (t as { publication?: { isSubscribed?: boolean } }).publication?.isSubscribed
    );
    if (subs.length === 0) return null;
    const ref = subs[0] as { participant?: { identity?: string; name?: string } };
    return ref.participant
      ? { identity: ref.participant.identity, name: ref.participant.name }
      : null;
  }, [screenShareTracks]);

  const speakingIdentities = React.useMemo(
    () => new Set(speakingParticipants.map((p) => p.identity)),
    [speakingParticipants]
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        Indicador de atividade
      </h3>

      {/* Quem está falando */}
      <section className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Mic className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium text-foreground">
            Quem está falando
          </span>
        </div>
        {speakingParticipants.length === 0 ? (
          <p className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/20 px-3 py-2">
            Ninguém falando no momento
          </p>
        ) : (
          <ul className="space-y-1.5">
            {speakingParticipants.map((p) => (
              <li
                key={p.identity}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 border transition-colors",
                  "border-primary/40 bg-primary/10"
                )}
              >
                <span className="flex h-2 w-2 shrink-0 rounded-full bg-primary animate-pulse" aria-hidden />
                <span className="text-sm font-medium truncate">
                  {p.isLocal ? "Você" : p.name || p.identity}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quem está compartilhando tela */}
      <section className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Monitor className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium text-foreground">
            Compartilhando tela
          </span>
        </div>
        {!whoIsSharing ? (
          <p className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/20 px-3 py-2">
            Ninguém compartilhando tela
          </p>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2">
            <span className="flex h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
            <span className="text-sm font-medium truncate">
              {whoIsSharing.name || whoIsSharing.identity}
            </span>
          </div>
        )}
      </section>

      {/* Participação na sala */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <User className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium text-foreground">
            Participantes na sala
          </span>
        </div>
        <ul className="space-y-1.5">
          {participants.map((p) => {
            const isSpeaking = speakingIdentities.has(p.identity);
            return (
              <li
                key={p.identity}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 border border-border bg-muted/10 transition-colors",
                  isSpeaking && "border-primary/30 bg-primary/5"
                )}
              >
                <div className="h-7 w-7 shrink-0 rounded-full bg-primary/15 flex items-center justify-center text-xs font-medium text-primary">
                  {(p.name || p.identity || "?").charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium truncate flex-1 min-w-0">
                  {p.isLocal ? "Você" : p.name || p.identity}
                </span>
                {isSpeaking && (
                  <span
                    className="flex h-2 w-2 shrink-0 rounded-full bg-primary animate-pulse"
                    title="Falando"
                    aria-label="Falando"
                  />
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
