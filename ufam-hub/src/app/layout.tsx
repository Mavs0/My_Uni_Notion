import type { Metadata } from "next";
import dynamic from "next/dynamic";
import "./globals.css";
import LayoutContent from "./layout-content";

const Providers = dynamic(() => import("./providers"), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span className="text-muted-foreground animate-pulse">Carregando...</span>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "UFAM Hub",
  description: "Organizador acadêmico pessoal com IA",
  manifest: "/site.webmanifest",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground font-sans">
        <Providers>
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}
