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
  }))
);

function LayoutContentInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const authPages = ["/login", "/esqueci-senha", "/resetar-senha", "/config-error"];
  const isAuthPage = authPages.includes(pathname);
  const isErrorPage = pathname === "/404" || pathname === "/500";

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
        <FocusModeWrapper>{children}</FocusModeWrapper>
      </VoiceCommandsProvider>
    </MobileMenuProvider>
  );
}

function FocusModeWrapper({ children }: { children: React.ReactNode }) {
  const { isActive: isFocusModeActive, settings } = useFocusMode();

  return (
    <CommandPaletteProvider>
      <FocusMode />
      {!isFocusModeActive && (
        <>
          <SkipLink />
          <TopBar />
        </>
      )}
      <div className={cn("flex", isFocusModeActive && "h-screen overflow-hidden")}>
        {!isFocusModeActive && <Sidebar />}
        <main
          id="main-content"
          className={cn(
            "flex-1 w-full",
            !isFocusModeActive && "p-4 max-w-6xl mx-auto",
            isFocusModeActive && "h-full overflow-auto pt-12"
          )}
          role="main"
          aria-label="Conteúdo principal"
        >
          {isFocusModeActive ? (
            <div
              className={cn(
                "focus-mode-content-wrapper max-w-4xl mx-auto p-8",
                settings.fontSize === "large" && "text-lg",
                settings.fontSize === "extra-large" && "text-xl"
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
