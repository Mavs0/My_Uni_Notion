import type { Metadata, Viewport } from "next";
import "./globals.css";
import LayoutContent from "./layout-content";
import Providers from "./providers";

/* Import estático: dynamic(import) no root + HMR pode causar
 * __webpack_modules__[moduleId] is not a function ao hidratar /login. */

export const metadata: Metadata = {
  title: "UFAM Hub",
  description: "Organizador acadêmico pessoal com IA",
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/logo-dark.png?v2" as="image" />
        <link rel="preload" href="/logo-light.png?v2" as="image" />
      </head>
      <body
        className="antialiased min-h-screen bg-background text-foreground font-sans"
        suppressHydrationWarning
      >
        <Providers>
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}
