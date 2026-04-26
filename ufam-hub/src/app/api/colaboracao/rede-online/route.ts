import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

export type RedeOnlineUser = {
  id: string;
  nome: string;
  avatar_url: string;
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const since = new Date(Date.now() - 45 * 60 * 1000).toISOString();

    const { data: rows, error: actError } = await supabase
      .from("user_activities")
      .select("user_id, created_at")
      .neq("user_id", user.id)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(400);

    const orderedIds: string[] = [];
    const seen = new Set<string>();
    if (!actError && rows) {
      for (const r of rows) {
        const uid = r.user_id as string | undefined;
        if (!uid || seen.has(uid)) continue;
        seen.add(uid);
        orderedIds.push(uid);
        if (orderedIds.length >= 20) break;
      }
    }

    let adminClient: ReturnType<typeof createSupabaseAdmin> | null = null;
    try {
      adminClient = createSupabaseAdmin();
    } catch {
      return NextResponse.json({ users: [], source: "no_admin" }, { status: 200 });
    }

    const users: RedeOnlineUser[] = [];

    async function pushUser(uid: string) {
      if (!adminClient || users.some((u) => u.id === uid)) return;
      try {
        const { data: udata } = await adminClient.auth.admin.getUserById(uid);
        if (!udata?.user) return;
        const m = udata.user.user_metadata || {};
        users.push({
          id: udata.user.id,
          nome:
            m.nome ||
            m.full_name ||
            udata.user.email?.split("@")[0] ||
            "Usuário",
          avatar_url: typeof m.avatar_url === "string" ? m.avatar_url : "",
        });
      } catch {
        /* skip */
      }
    }

    for (const uid of orderedIds) {
      await pushUser(uid);
      if (users.length >= 15) break;
    }

    if (users.length < 4 && adminClient) {
      try {
        const { data: listData } = await adminClient.auth.admin.listUsers({
          page: 1,
          perPage: 50,
        });
        const others = (listData?.users || []).filter((u) => u.id !== user.id);
        for (const u of others) {
          if (users.length >= 12) break;
          await pushUser(u.id);
        }
      } catch {
        /* ignore */
      }
    }

    return NextResponse.json({
      users: users.slice(0, 15),
      source: orderedIds.length > 0 ? "atividade_recente" : "rede",
    });
  } catch (e) {
    console.error("rede-online:", e);
    return NextResponse.json({ users: [] }, { status: 200 });
  }
}
