"use client";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { I18nProvider } from "@/lib/i18n/context";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const [defaultTheme, setDefaultTheme] = useState<"light" | "dark" | "system">(
    "system"
  );
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const loadUserTheme = async () => {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const { profile } = await response.json();
          const userTheme = profile.tema_preferencia;
          if (userTheme && ["light", "dark", "system"].includes(userTheme)) {
            setDefaultTheme(userTheme as "light" | "dark" | "system");
          }
        }
      } catch (error) {
        console.error("Erro ao carregar preferência de tema:", error);
      } finally {
        setMounted(true);
      }
    };
    loadUserTheme();
  }, []);
  if (!mounted) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    );
  }
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem
      storageKey="theme-preference"
    >
      {children}
    </ThemeProvider>
  );
}
export default function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient());
  return (
    <ThemeProviderWrapper>
      <QueryClientProvider client={qc}>
        <I18nProvider>
          <ServiceWorkerRegistration />
          {children}
          <Toaster
            position="top-right"
            expand={true}
            duration={4000}
            closeButton
            richColors
            toastOptions={{
              classNames: {
                toast:
                  "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:rounded-lg group-[.toaster]:backdrop-blur-sm group-[.toaster]:p-4 group-[.toaster]:min-w-[320px] group-[.toaster]:max-w-[420px]",
                description:
                  "group-[.toast]:text-muted-foreground group-[.toast]:text-sm group-[.toast]:mt-1",
                actionButton:
                  "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:hover:opacity-90 group-[.toast]:transition-opacity",
                cancelButton:
                  "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:hover:opacity-90 group-[.toast]:transition-opacity",
                success:
                  "group-[.toast]:bg-green-50/95 group-[.toast]:text-green-900 group-[.toast]:border-green-200/80 dark:group-[.toast]:bg-green-950/95 dark:group-[.toast]:text-green-100 dark:group-[.toast]:border-green-800/50 group-[.toast]:shadow-green-500/10",
                error:
                  "group-[.toast]:bg-red-50/95 group-[.toast]:text-red-900 group-[.toast]:border-red-200/80 dark:group-[.toast]:bg-red-950/95 dark:group-[.toast]:text-red-100 dark:group-[.toast]:border-red-800/50 group-[.toast]:shadow-red-500/10",
                warning:
                  "group-[.toast]:bg-yellow-50/95 group-[.toast]:text-yellow-900 group-[.toast]:border-yellow-200/80 dark:group-[.toast]:bg-yellow-950/95 dark:group-[.toast]:text-yellow-100 dark:group-[.toast]:border-yellow-800/50 group-[.toast]:shadow-yellow-500/10",
                info: "group-[.toast]:bg-blue-50/95 group-[.toast]:text-blue-900 group-[.toast]:border-blue-200/80 dark:group-[.toast]:bg-blue-950/95 dark:group-[.toast]:text-blue-100 dark:group-[.toast]:border-blue-800/50 group-[.toast]:shadow-blue-500/10",
              },
            }}
          />
        </I18nProvider>
      </QueryClientProvider>
    </ThemeProviderWrapper>
  );
}