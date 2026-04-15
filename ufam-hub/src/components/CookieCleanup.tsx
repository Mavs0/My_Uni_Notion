"use client";

import { useEffect, useState } from "react";
import { runClientSupabaseCookieSweepIfNeeded } from "@/lib/supabase/cookie-emergency-client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function CookieCleanup() {
  const [showDialog, setShowDialog] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  useEffect(() => {
    runClientSupabaseCookieSweepIfNeeded();

    const checkCookieSize = async () => {
      try {
        const response = await fetch("/api/auth/cleanup-cookies", {
          method: "GET",
          credentials: "include",
        }).catch(() => null);
        
        if (response?.ok) {
          try {
            const data = await response.json();
            const kb = parseFloat(data.totalSizeKB || "0");
            // Só avisar perto do limite real de emergência (~512 KB), não em sessões normais.
            if (
              process.env.NODE_ENV === "development" &&
              kb > 480
            ) {
              console.warn(
                "[CookieCleanup] Cookies acumulados (~",
                kb.toFixed(0),
                "KB). Se tiveres 431/401, usa /limpar-cookies.",
              );
            }
          } catch {
            /* ignore */
          }
        }
      } catch (error) {
      }
    };

    checkCookieSize();

    const handleError = (event: ErrorEvent) => {
      const message = event.message || "";
      
      const isNetworkError =
        message.includes("Failed to fetch") ||
        message.includes("ERR_NAME_NOT_RESOLVED") ||
        message.includes("ERR_INTERNET_DISCONNECTED") ||
        message.includes("NetworkError");

      if (
        !isNetworkError &&
        (message.includes("431") ||
          message.includes("494") ||
          message.includes("REQUEST_HEADER_TOO_LARGE") ||
          message.includes("Header Fields Too Large") ||
          message.includes("Request header fields too large") ||
          message.includes("too large of headers"))
      ) {
        setShowDialog(true);
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = 
        (reason?.message || "") + 
        (reason?.toString() || "") + 
        (typeof reason === "string" ? reason : "");
      
      const isNetworkError = 
        message.includes("Failed to fetch") ||
        message.includes("ERR_NAME_NOT_RESOLVED") ||
        message.includes("ERR_INTERNET_DISCONNECTED") ||
        message.includes("NetworkError") ||
        (reason && typeof reason === "object" && "name" in reason && reason.name === "TypeError");
      
      if (
        !isNetworkError &&
        (message.includes("431") ||
          message.includes("494") ||
          message.includes("REQUEST_HEADER_TOO_LARGE") ||
          message.includes("Header Fields Too Large") ||
          message.includes("Request header fields too large") ||
          message.includes("too large of headers") ||
          reason?.status === 431 ||
          reason?.status === 494)
      ) {
        setShowDialog(true);
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  const handleCleanup = async () => {
    setIsCleaning(true);
    try {
      let response: Response | null = null;
      try {
        response = await fetch("/api/auth/cleanup-cookies?reset=1", {
          method: "POST",
          credentials: "include",
        });
      } catch (fetchError) {
        console.warn("API de limpeza inacessível, limpando cookies manualmente");
        response = null;
      }

      if (!response || !response.ok) {
        console.warn("API de limpeza inacessível, limpando TODOS os cookies");
        try {
          document.cookie.split(";").forEach((c) => {
            const name = c.split("=")[0].trim();
            if (name) {
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
            }
          });
        } catch (cookieError) {
          console.error("Erro ao limpar cookies:", cookieError);
        }
      } else {
        try {
          const data = await response.json();
          console.log("Cookies limpos:", data);
        } catch (jsonError) {
          console.warn("Erro ao parsear resposta da API de limpeza");
        }
      }
      
      const chatThreads = localStorage.getItem("chatThreads:v1");
      if (chatThreads && chatThreads.length > 100000) {
        try {
          const threads = JSON.parse(chatThreads);
          if (Array.isArray(threads) && threads.length > 20) {
            const recentThreads = threads
              .sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0))
              .slice(0, 20);
            localStorage.setItem("chatThreads:v1", JSON.stringify(recentThreads));
          }
        } catch (e) {
          localStorage.removeItem("chatThreads:v1");
        }
      }

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Erro ao limpar cookies:", error);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Erro de Cabeçalhos Muito Grandes
          </AlertDialogTitle>
          <AlertDialogDescription>
            Os cabeçalhos da requisição estão muito grandes (erros 431 ou 494 na
            Vercel). Isso costuma acontecer quando a sessão Supabase se fragmenta em
            muitos cookies (por exemplo, avatar em base64 no perfil).
            <br />
            <br />
            Podemos limpar cookies antigos e dados grandes para resolver isso?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleCleanup} disabled={isCleaning}>
            {isCleaning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Limpando...
              </>
            ) : (
              "Limpar e Recarregar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
