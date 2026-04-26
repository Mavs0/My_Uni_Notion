"use client";

import { UfamErrorShell } from "@/components/errors/ufam-error-shell";

export default function NotFound() {
  return (
    <UfamErrorShell
      code="404"
      title="Página não encontrada"
      description="Parece que você se perdeu no meio do caminho. A página que você está procurando não existe ou foi movida."
      onRetry={() => {
        window.location.reload();
      }}
    />
  );
}
