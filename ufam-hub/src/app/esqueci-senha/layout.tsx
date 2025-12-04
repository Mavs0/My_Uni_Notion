import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Esqueci minha senha - UFAM Hub",
  description: "Recupere sua senha do UFAM Hub",
};
export default function EsqueciSenhaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}