"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  isInlineDataAvatar,
  MAX_AVATAR_URL_LENGTH,
} from "@/lib/profile/avatar-metadata";

/**
 * Imediatamente após login: tenta remover URL inválida/gigante do metadata e
 * `refreshSession()` para aliviar cookies.
 *
 * **Avatar em base64 (data URI) no perfil:** não chamamos `updateUser` aqui.
 * O pedido PUT a `auth/v1/user` leva `Authorization: Bearer <JWT>` já enorme —
 * o browser devolve `net::ERR_CONNECTION_RESET` / 431 antes de conseguirmos limpar.
 * Nesse caso remove a foto no Supabase Dashboard (Authentication → Users) ou usa
 * «Limpar sessão» e volta a entrar depois de corrigir o perfil.
 */
export async function shrinkJwtByStrippingInlineAvatarClient(
  supabase: SupabaseClient,
  user: User | null | undefined,
): Promise<void> {
  if (!user) return;
  const raw = user.user_metadata?.avatar_url;
  if (typeof raw !== "string") return;
  if (!isInlineDataAvatar(raw) && raw.length <= MAX_AVATAR_URL_LENGTH) return;

  if (isInlineDataAvatar(raw)) {
    return;
  }

  const { error: uerr } = await supabase.auth.updateUser({
    data: { avatar_url: "" },
  });
  if (uerr) return;
  await supabase.auth.refreshSession();
}

/**
 * Remove avatar em base64 do user_metadata (JWT mais leve).
 * Usa só a API no servidor — chamar getUser() no browser com JWT enorme
 * dispara pedidos a auth/v1/user que rebentam com ERR_CONNECTION_RESET.
 */
export async function stripInlineAvatarIfNeeded(): Promise<
  "stripped" | "ok" | "error"
> {
  try {
    const res = await fetch("/api/auth/sanitize-inline-avatar", {
      method: "POST",
      credentials: "include",
    });
    if (res.status === 401) return "error";
    if (!res.ok) return "error";
    const data = (await res.json()) as { stripped?: boolean };
    return data.stripped ? "stripped" : "ok";
  } catch {
    return "error";
  }
}
