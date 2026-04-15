import { Suspense } from "react";
import { SearchParamsRouteFallback } from "@/components/SearchParamsRouteFallback";

export default function DisciplinasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<SearchParamsRouteFallback />}>{children}</Suspense>
  );
}
