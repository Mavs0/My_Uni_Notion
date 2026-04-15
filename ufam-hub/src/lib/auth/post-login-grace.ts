/** Evita loop login ↔ dashboard: após entrar, os cookies ainda podem não estar estáveis no 1.º GET a /api/*. */

export const UFAM_POST_LOGIN_UNTIL_KEY = "ufam-post-login-until";

const DEFAULT_MS = 60_000;

export function markPostLoginNavigation(ms: number = DEFAULT_MS): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      UFAM_POST_LOGIN_UNTIL_KEY,
      String(Date.now() + ms),
    );
  } catch {
    /* modo privado / quota */
  }
}

export function isWithinPostLoginGrace(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    const until = sessionStorage.getItem(UFAM_POST_LOGIN_UNTIL_KEY);
    if (!until) return false;
    return Date.now() < parseInt(until, 10);
  } catch {
    return false;
  }
}

export function clearPostLoginGrace(): void {
  try {
    sessionStorage.removeItem(UFAM_POST_LOGIN_UNTIL_KEY);
  } catch {
    /* ignore */
  }
}
