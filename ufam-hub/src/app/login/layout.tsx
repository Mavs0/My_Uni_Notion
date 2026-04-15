import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchParamsRouteFallback } from "@/components/SearchParamsRouteFallback";

export const metadata: Metadata = {
  title: "Login - UFAM Hub",
  description: "Faça login no UFAM Hub",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<SearchParamsRouteFallback />}>{children}</Suspense>
  );
}