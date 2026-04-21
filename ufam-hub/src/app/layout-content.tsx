"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState, lazy, Suspense } from "react";
import TopBar from "../components/ui/topbar";
import { Sidebar } from "../components/ui/sidebar";
import { CommandPaletteProvider } from "../components/ui/command-palette";
import { MobileMenuProvider } from "../components/ui/mobile-menu-context";
import { SkipLink } from "../components/SkipLink";
import { useGlobalShortcuts } from "@/hooks/useKeyboardShortcuts";
import { VoiceCommandsProvider } from "@/components/VoiceCommandsProvider";
import { FocusMode } from "@/components/FocusMode";
import { PomodoroFloatingWidget } from "@/components/PomodoroFloatingWidget";
import { useFocusMode } from "@/contexts/FocusModeContext";
import { cn } from "@/lib/utils";

const VirtualAssistant = lazy(() =>
  import("../components/VirtualAssistant").then((mod) => ({
    default: mod.VirtualAssistant,
  })),
);

function LayoutContentInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const authPages = [
    "/login",
    "/cadastro-convidado",
    "/esqueci-senha",
    "/resetar-senha",
    "/config-error",
  ];
  const isAuthPage = authPages.includes(pathname);
  const isErrorPage = pathname === "/404" || pathname === "/500";
  const isChamadaPage =
    typeof pathname === "string" && pathname.includes("/chamada");

  useGlobalShortcuts();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isAuthPage || isErrorPage || isChamadaPage) {
    return <>{children}</>;
  }

  return (
    <MobileMenuProvider>
      <VoiceCommandsProvider>
        <FocusModeWrapper>{children}</FocusModeWrapper>
      </VoiceCommandsProvider>
    </MobileMenuProvider>
  );
}

function FocusModeWrapper({ children }: { children: React.ReactNode }) {
  const { isActive: isFocusModeActive, settings } = useFocusMode();
  const pathname = usePathname();
  /** Editor de notas: largura total (sem sidebar / sem caixa max-w), estilo sala de chamada */
  const isNotasEditorPage =
    typeof pathname === "string" &&
    /\/disciplinas\/[^/]+\/notas\//.test(pathname);
  /** Calendário: usa toda a largura útil (sem max-w-6xl no main) */
  const isCalendarPage = pathname === "/calendar";
  const isChatPage = pathname === "/chat";
  const isGruposWide =
    pathname === "/grupos" ||
    (typeof pathname === "string" && pathname.startsWith("/grupos/"));
  /** Perfil público /perfil/[id]: layout largo estilo portfolio */
  const isPublicProfileWide =
    typeof pathname === "string" && /^\/perfil\/.+/.test(pathname);
  /** Meu perfil /perfil: definições em duas colunas */
  const isMeuPerfilWide = pathname === "/perfil";
  const isDashboardWide = pathname === "/dashboard";
  const isFullWidthMain =
    isNotasEditorPage || isCalendarPage || isChatPage;

  return (
    <CommandPaletteProvider>
      <FocusMode />
      {!isFocusModeActive && (
        <>
          <SkipLink />
          <TopBar />
        </>
      )}
      <div
        className={cn(
          "flex min-h-0 flex-1",
          isFocusModeActive && "h-screen overflow-hidden",
          isFullWidthMain && !isFocusModeActive && "min-h-[calc(100dvh-3.5rem)]",
        )}
      >
        {!isFocusModeActive && !isNotasEditorPage && <Sidebar />}
        <main
          id="main-content"
          className={cn(
            "flex-1 w-full min-h-0",
            !isFocusModeActive &&
              !isFullWidthMain &&
              !isGruposWide &&
              !isPublicProfileWide &&
              !isMeuPerfilWide &&
              !isDashboardWide &&
              "p-4 max-w-6xl mx-auto pb-24 md:pb-4",
            !isFocusModeActive &&
              (isGruposWide ||
                isPublicProfileWide ||
                isMeuPerfilWide ||
                isDashboardWide) &&
              "mx-auto w-full max-w-none p-4 pb-24 md:pb-4",
            !isFocusModeActive &&
              isFullWidthMain &&
              !isCalendarPage &&
              !isChatPage &&
              "p-0 max-w-none overflow-hidden pb-0 md:pb-0",
            !isFocusModeActive &&
              isChatPage &&
              "max-w-none overflow-hidden p-2 sm:p-3 md:p-4 pb-20 md:pb-4",
            !isFocusModeActive &&
              isCalendarPage &&
              "p-0 max-w-none overflow-auto pb-24 md:pb-6",
            isFocusModeActive && "h-full overflow-auto pt-12",
          )}
          role="main"
          aria-label="Conteúdo principal"
        >
          {isFocusModeActive ? (
            <div
              className={cn(
                "focus-mode-content-wrapper max-w-4xl mx-auto p-8",
                settings.fontSize === "large" && "text-lg",
                settings.fontSize === "extra-large" && "text-xl",
              )}
            >
              {children}
            </div>
          ) : (
            children
          )}
        </main>
      </div>
      {!isFocusModeActive && (
        <Suspense fallback={null}>
          <VirtualAssistant />
        </Suspense>
      )}
      <PomodoroFloatingWidget />
    </CommandPaletteProvider>
  );
}

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutContentInner>{children}</LayoutContentInner>;
}
