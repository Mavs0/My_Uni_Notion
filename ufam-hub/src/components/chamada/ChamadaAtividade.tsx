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
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-white p-4 dark:bg-slate-900">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
        Indicador de atividade
      </h3>

      {/* Quem está falando */}
      <section className="mb-5">
        <div className="mb-2 flex items-center gap-2">
          <Mic className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Quem está falando
          </span>
        </div>
        {speakingParticipants.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200">
            Ninguém falando no momento
          </p>
        ) : (
          <ul className="space-y-1.5">
            {speakingParticipants.map((p) => (
              <li
                key={p.identity}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors",
                  "border-emerald-200 bg-emerald-50 dark:border-emerald-700/60 dark:bg-emerald-950/50",
                )}
              >
                <span className="flex h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" aria-hidden />
                <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {p.isLocal ? "Você" : p.name || p.identity}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quem está compartilhando tela */}
      <section className="mb-5">
        <div className="mb-2 flex items-center gap-2">
          <Monitor className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Compartilhando tela
          </span>
        </div>
        {!whoIsSharing ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200">
            Ninguém compartilhando tela
          </p>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-700/60 dark:bg-emerald-950/50">
            <span className="flex h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
            <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
              {whoIsSharing.name || whoIsSharing.identity}
            </span>
          </div>
        )}
      </section>

      {/* Participação na sala */}
      <section>
        <div className="mb-2 flex items-center gap-2">
          <User className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
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
                  "flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 transition-colors dark:border-slate-600 dark:bg-slate-800/90",
                  isSpeaking &&
                    "border-emerald-200 bg-emerald-50/80 dark:border-emerald-700/60 dark:bg-emerald-950/40",
                )}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-medium text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-300">
                  {(p.name || p.identity || "?").charAt(0).toUpperCase()}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {p.isLocal ? "Você" : p.name || p.identity}
                </span>
                {isSpeaking && (
                  <span
                    className="flex h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500"
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
