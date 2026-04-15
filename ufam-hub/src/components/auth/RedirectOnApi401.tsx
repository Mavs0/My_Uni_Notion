"use client";

import { useEffect } from "react";
import {
  clearPostLoginGrace,
  isWithinPostLoginGrace,
} from "@/lib/auth/post-login-grace";

const AUTH_PATH_PREFIXES = [
  "/login",
  "/cadastro-convidado",
  "/esqueci-senha",
  "/resetar-senha",
  "/config-error",
  "/limpar-cookies",
];

function isAuthRoute(pathname: string): boolean {
  return AUTH_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function requestUrlString(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof Request) return input.url;
  return String(input);
}

function isSameOriginApi(urlStr: string): boolean {
  try {
    const u = new URL(urlStr, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    if (typeof window !== "undefined" && u.origin !== window.location.origin) {
      return false;
    }
    return u.pathname.startsWith("/api/");
  } catch {
    return false;
  }
}

function isSafeToRetry401(init?: RequestInit): boolean {
  const m = (init?.method || "GET").toUpperCase();
  return m === "GET" || m === "HEAD";
}

/**
 * Qualquer resposta 401 de /api/* redireciona para o login (exceto já em páginas de auth),
 * para não ficar vendo o app “quebrado” após sessão expirar em outra aba.
 *
 * GET/HEAD com 401: repetições evitam corrida de cookies após `signIn` / navegação
 * (sobretudo com `window.location.assign` → primeiro GET ao dashboard).
 * Após marcar pós-login (`markPostLoginNavigation`), há várias tentativas com backoff.
 */
export function RedirectOnApi401() {
  useEffect(() => {
    let redirecting = false;
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init) => {
      let res = await originalFetch(input, init);
      if (
        res.status === 401 &&
        isSameOriginApi(requestUrlString(input)) &&
        isSafeToRetry401(init)
      ) {
        const delays = isWithinPostLoginGrace()
          ? [100, 200, 400, 700, 1100]
          : [120];
        for (const ms of delays) {
          await new Promise((r) => setTimeout(r, ms));
          res = await originalFetch(input, init);
          if (res.status !== 401) {
            if (res.ok) clearPostLoginGrace();
            return res;
          }
        }
      }
      if (res.status !== 401 || redirecting) return res;
      const urlStr = requestUrlString(input);
      if (!isSameOriginApi(urlStr)) return res;
      const path = window.location.pathname;
      if (isAuthRoute(path)) return res;
      /* Durante o minuto após login, 401 pode ser corrida de cookies — não forçar /login. */
      if (isWithinPostLoginGrace()) return res;
      redirecting = true;
      const next = `${path}${window.location.search}`;
      window.location.assign(
        `/login?redirect=${encodeURIComponent(next)}`
      );
      return res;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
