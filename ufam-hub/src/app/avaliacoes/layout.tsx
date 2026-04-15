import { Suspense } from "react";
import { SearchParamsRouteFallback } from "@/components/SearchParamsRouteFallback";

export default function AvaliacoesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<SearchParamsRouteFallback />}>{children}</Suspense>
  );
}
