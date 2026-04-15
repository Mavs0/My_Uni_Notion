/**
 * Evita PUT /api/profile sem sessão (401 no terminal ao mudar tema na página de login
 * ou após cookie_limit limpar cookies).
 */
export async function putProfileIfAuthenticated(
  body: Record<string, unknown>,
): Promise<Response | null> {
  try {
    const sessionRes = await fetch("/api/auth/session", {
      credentials: "include",
    });
    if (!sessionRes.ok) return null;
    const data = (await sessionRes.json()) as { authenticated?: boolean };
    if (!data.authenticated) return null;
    return await fetch("/api/profile", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return null;
  }
}
