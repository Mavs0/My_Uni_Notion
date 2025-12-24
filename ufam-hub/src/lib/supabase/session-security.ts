/**
 * Utilitários para segurança de sessão
 */

export interface SessionSecurityConfig {
  maxAge?: number; // Tempo máximo de sessão em segundos (padrão: 7 dias)
  refreshThreshold?: number; // Tempo antes de expirar para renovar (padrão: 1 hora)
  requireReauth?: boolean; // Requerer reautenticação para ações sensíveis
}

const DEFAULT_CONFIG: Required<SessionSecurityConfig> = {
  maxAge: 7 * 24 * 60 * 60, // 7 dias
  refreshThreshold: 60 * 60, // 1 hora
  requireReauth: false,
};

/**
 * Verifica se a sessão está próxima de expirar e precisa ser renovada
 */
export function shouldRefreshSession(
  expiresAt: number,
  config: SessionSecurityConfig = {}
): boolean {
  const { refreshThreshold } = { ...DEFAULT_CONFIG, ...config };
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = expiresAt - now;
  return timeUntilExpiry < refreshThreshold;
}

/**
 * Verifica se a sessão expirou
 */
export function isSessionExpired(expiresAt: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return expiresAt <= now;
}

/**
 * Calcula o tempo restante da sessão em segundos
 */
export function getSessionTimeRemaining(expiresAt: number): number {
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, expiresAt - now);
}

/**
 * Formata o tempo restante da sessão para exibição
 */
export function formatSessionTimeRemaining(expiresAt: number): string {
  const seconds = getSessionTimeRemaining(expiresAt);

  if (seconds === 0) return "Expirada";

  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

/**
 * Configurações de segurança para cookies de sessão
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: DEFAULT_CONFIG.maxAge,
  path: "/",
};
