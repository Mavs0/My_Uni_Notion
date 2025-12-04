import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Login - UFAM Hub",
  description: "Faça login no UFAM Hub",
};
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}