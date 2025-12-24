"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState, lazy, Suspense } from "react";
import TopBar from "../components/ui/topbar";
import { Sidebar } from "../components/ui/sidebar";
import { MobileMenuProvider } from "../components/ui/mobile-menu-context";
import { SkipLink } from "../components/SkipLink";
import { useGlobalShortcuts } from "@/hooks/useKeyboardShortcuts";
import { VoiceCommandsProvider } from "@/components/VoiceCommandsProvider";

// Lazy load do VirtualAssistant - só carrega quando necessário
const VirtualAssistant = lazy(() =>
  import("../components/VirtualAssistant").then((mod) => ({
    default: mod.VirtualAssistant,
  }))
);

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const authPages = ["/login", "/esqueci-senha", "/resetar-senha"];
  const isAuthPage = authPages.includes(pathname);
  const isErrorPage = pathname === "/404" || pathname === "/500";

  // Ativa atalhos de teclado globais
  useGlobalShortcuts();

  useEffect(() => {
    setMounted(true);
  }, []);
  if (isAuthPage || isErrorPage) {
    return <>{children}</>;
  }
  return (
    <MobileMenuProvider>
      <VoiceCommandsProvider>
        <SkipLink />
        <TopBar />
        <div className="flex">
          <Sidebar />
          <main
            id="main-content"
            className="flex-1 p-4 max-w-6xl mx-auto w-full"
            role="main"
            aria-label="Conteúdo principal"
          >
            {children}
          </main>
        </div>
        <Suspense fallback={null}>
          <VirtualAssistant />
        </Suspense>
      </VoiceCommandsProvider>
    </MobileMenuProvider>
  );
}
