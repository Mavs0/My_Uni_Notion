"use client";

import { useEffect } from "react";
import { UfamErrorShell } from "@/components/errors/ufam-error-shell";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro capturado:", error);
  }, [error]);

  return (
    <UfamErrorShell
      code="500"
      title="Erro interno do servidor"
      description="Estamos enfrentando instabilidades no momento. Nossa equipe já foi notificada e está trabalhando para resolver o problema."
      onRetry={reset}
      extra={
        error.message ? (
          <details className="mb-6 max-w-lg rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-left text-xs text-zinc-500 backdrop-blur-sm">
            <summary className="cursor-pointer select-none font-medium text-zinc-400">
              Detalhes técnicos
            </summary>
            <p className="mt-2 font-mono break-all text-zinc-500">{error.message}</p>
            {error.digest ? (
              <p className="mt-1 font-mono text-[10px] text-zinc-600">Digest: {error.digest}</p>
            ) : null}
          </details>
        ) : null
      }
    />
  );
}
