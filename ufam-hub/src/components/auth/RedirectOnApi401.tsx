"use client";

import { useEffect } from "react";

const AUTH_PATH_PREFIXES = [
  "/login",
  "/esqueci-senha",
  "/resetar-senha",
  "/config-error",
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

/**
 * Qualquer resposta 401 de /api/* redireciona para o login (exceto já em páginas de auth),
 * para não ficar vendo o app “quebrado” após sessão expirar em outra aba.
 */
export function RedirectOnApi401() {
  useEffect(() => {
    let redirecting = false;
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init) => {
      const res = await originalFetch(input, init);
      if (res.status !== 401 || redirecting) return res;
      const urlStr = requestUrlString(input);
      if (!isSameOriginApi(urlStr)) return res;
      const path = window.location.pathname;
      if (isAuthRoute(path)) return res;
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
