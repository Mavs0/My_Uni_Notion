import { Suspense } from "react";
import { SearchParamsRouteFallback } from "@/components/SearchParamsRouteFallback";

export default function AuthConfirmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<SearchParamsRouteFallback />}>{children}</Suspense>
  );
}
