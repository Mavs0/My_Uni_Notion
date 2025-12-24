import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { generateText } from "ai";
import { getAIModel } from "@/lib/ai/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { texto, titulo, disciplinaId } = body;

    if (!texto) {
      return NextResponse.json(
        { error: "Texto é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar nome da disciplina
    let disciplinaNome = "";
    if (disciplinaId) {
      const { data: disciplina } = await supabase
        .from("disciplinas")
        .select("nome")
        .eq("id", disciplinaId)
        .single();
      disciplinaNome = disciplina?.nome || "";
    }

    const prompt = `Você é um especialista em criar mapas mentais para estudo.

${titulo ? `TÍTULO: ${titulo}` : ""}
${disciplinaNome ? `DISCIPLINA: ${disciplinaNome}` : ""}

TEXTO PARA TRANSFORMAR EM MAPA MENTAL:
${texto}

Analise o texto e crie um mapa mental estruturado no formato JSON:

{
  "mapaMental": {
    "titulo": "Título principal do mapa",
    "descricao": "Breve descrição do tema",
    "nocentral": {
      "texto": "Conceito central",
      "cor": "#6366f1"
    },
    "ramos": [
      {
        "id": "1",
        "texto": "Tópico principal 1",
        "cor": "#22c55e",
        "subramos": [
          {
            "id": "1.1",
            "texto": "Subtópico 1.1",
            "detalhes": "Detalhes adicionais se houver"
          },
          {
            "id": "1.2",
            "texto": "Subtópico 1.2"
          }
        ]
      },
      {
        "id": "2",
        "texto": "Tópico principal 2",
        "cor": "#f59e0b",
        "subramos": [
          {
            "id": "2.1",
            "texto": "Subtópico 2.1"
          }
        ]
      }
    ],
    "conexoes": [
      {
        "de": "1.1",
        "para": "2.1",
        "descricao": "Relação entre os conceitos"
      }
    ],
    "resumo": "Um parágrafo resumindo as principais ideias do mapa"
  }
}

REGRAS:
- Extraia os conceitos principais e secundários
- Use cores diferentes para cada ramo (cores em hex)
- Identifique conexões entre conceitos quando houver
- Mantenha os textos concisos
- Inclua detalhes importantes como subramos
- Responda APENAS com o JSON, sem texto adicional
- Use entre 3 e 7 ramos principais
- Cada ramo pode ter até 5 subramos`;

    let model;
    let result;
    let text;

    try {
      model = getAIModel();
      result = await generateText({
        model,
        prompt,
      });
      text = result.text;
    } catch (modelError: any) {
      console.error("Erro ao usar modelo padrão:", modelError);

      if (
        modelError.message?.includes("not found") ||
        modelError.message?.includes("404")
      ) {
        try {
          const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
          if (!apiKey) {
            throw new Error("API key não configurada");
          }

          const genAI = new GoogleGenerativeAI(apiKey);

          // Primeiro, tentar listar modelos disponíveis
          let modelosDisponiveis: string[] = [];
          try {
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
            );
            if (response.ok) {
              const data = await response.json();
              modelosDisponiveis = (data.models || [])
                .map((m: any) => m.name?.replace("models/", "") || "")
                .filter((n: string) => n && n.includes("gemini"));
              console.log(
                "✅ Modelos disponíveis encontrados:",
                modelosDisponiveis
              );
            }
          } catch (listError) {
            console.log(
              "⚠️ Não foi possível listar modelos, usando lista padrão"
            );
          }

          // Tentar modelos diferentes na ordem de preferência
          const modelosParaTentar =
            modelosDisponiveis.length > 0
              ? modelosDisponiveis
              : [
                  "gemini-1.5-flash-002",
                  "gemini-1.5-pro-002",
                  "gemini-1.5-flash",
                  "gemini-1.5-pro",
                  "gemini-pro",
                ];

          let ultimoErro: any = null;
          for (const nomeModelo of modelosParaTentar) {
            try {
              const modelo = genAI.getGenerativeModel({ model: nomeModelo });
              const resultado = await modelo.generateContent(prompt);
              text = resultado.response.text();
              console.log(`✅ Modelo ${nomeModelo} funcionou!`);
              break;
            } catch (erroModelo: any) {
              console.log(
                `❌ Modelo ${nomeModelo} falhou:`,
                erroModelo.message
              );
              ultimoErro = erroModelo;
              continue;
            }
          }

          if (!text) {
            throw new Error(
              `Nenhum modelo disponível. Tentei: ${modelosParaTentar.join(
                ", "
              )}. Último erro: ${ultimoErro?.message || "Desconhecido"}`
            );
          }
        } catch (fallbackError: any) {
          throw new Error(
            `Erro ao usar API direta do Google: ${fallbackError.message}. Verifique sua API key e modelos disponíveis no Google AI Studio.`
          );
        }
      } else {
        throw modelError;
      }
    }

    // Tentar extrair JSON da resposta
    let mapaMental;
    try {
      // Remover markdown se presente
      const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
      mapaMental = JSON.parse(jsonStr);
    } catch {
      // Se falhar, retornar o texto como está
      return NextResponse.json({
        mapaMental: null,
        rawResponse: text,
        error: "Não foi possível parsear o mapa mental",
      });
    }

    return NextResponse.json(mapaMental);
  } catch (error: any) {
    console.error("Erro ao gerar mapa mental:", error);
    return NextResponse.json(
      { error: "Erro ao gerar mapa mental: " + error.message },
      { status: 500 }
    );
  }
}
