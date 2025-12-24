import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider"); // 'google' ou 'github'
    const redirectTo = searchParams.get("redirectTo") || "/dashboard";

    if (!provider || !["google", "github"].includes(provider)) {
      return NextResponse.json(
        { error: "Provider inválido. Use 'google' ou 'github'" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer(request);
    const {
      data: { url },
      error,
    } = await supabase.auth.signInWithOAuth({
      provider: provider as "google" | "github",
      options: {
        redirectTo: `${
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
        }${redirectTo}`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error || !url) {
      console.error("Erro ao iniciar OAuth:", error);
      return NextResponse.json(
        { error: "Erro ao iniciar autenticação OAuth" },
        { status: 500 }
      );
    }

    return NextResponse.redirect(url);
  } catch (error: any) {
    console.error("Erro na API OAuth:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
