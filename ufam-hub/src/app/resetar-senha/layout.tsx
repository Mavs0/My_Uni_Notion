import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Redefinir senha - UFAM Hub",
  description: "Redefina sua senha do UFAM Hub",
};
export default function ResetarSenhaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}