import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { isInlineDataAvatar } from "@/lib/profile/avatar-metadata";

/**
 * Remove avatar em data: do user_metadata no Supabase Auth (JWT mais leve).
 * Corre só no servidor — nunca chamar getUser() no browser com JWT gigante
 * (provoca ERR_CONNECTION_RESET em auth/v1/user).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const raw = user.user_metadata?.avatar_url;
    if (typeof raw !== "string" || !isInlineDataAvatar(raw)) {
      return NextResponse.json({ ok: true, stripped: false });
    }
    const { error: uerr } = await supabase.auth.updateUser({
      data: { avatar_url: "" },
    });
    if (uerr) {
      console.error("sanitize-inline-avatar updateUser:", uerr.message);
      return NextResponse.json(
        { error: "Não foi possível atualizar a sessão" },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, stripped: true });
  } catch (e) {
    console.error("sanitize-inline-avatar:", e);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 },
    );
  }
}
