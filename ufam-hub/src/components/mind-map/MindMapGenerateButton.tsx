"use client";

import { Loader2, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MM } from "@/lib/mind-map/mind-map-theme";

type Props = {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  className?: string;
};

export function MindMapGenerateButton({
  loading,
  disabled,
  onClick,
  className,
}: Props) {
  return (
    <Button
      type="button"
      size="lg"
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        "h-12 flex-1 rounded-xl font-medium transition-all",
        MM.primary,
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Gerando mapa mental...
        </>
      ) : (
        <>
          <Network className="mr-2 h-4 w-4" />
          Gerar mapa mental
        </>
      )}
    </Button>
  );
}
