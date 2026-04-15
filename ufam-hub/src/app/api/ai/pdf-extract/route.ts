import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Apenas arquivos PDF (.pdf) são aceitos" },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo: 10MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfParse = require("@bingsjs/pdf-parse") as (buffer: Buffer) => Promise<{ text: string; numpages: number }>;
    const data = await pdfParse(buffer);

    return NextResponse.json({
      texto: data.text?.trim() || "",
      numPages: data.numpages || 0,
    });
  } catch (error: any) {
    console.error("Erro ao extrair texto do PDF:", error);
    return NextResponse.json(
      {
        error:
          error.message ||
          "Não foi possível extrair texto do PDF. Verifique se o arquivo é válido.",
      },
      { status: 500 }
    );
  }
}
