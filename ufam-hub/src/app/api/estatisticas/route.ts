import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get("periodo") || "30";
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const dias = parseInt(periodo);
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - dias);
    const dataInicioISO = dataInicio.toISOString().split("T")[0];
    const { data: disciplinas, error: discError } = await supabase
      .from("disciplinas")
      .select("id, nome, tipo, horas_semana")
      .eq("user_id", user.id);
    if (discError) {
      console.error("Erro ao buscar disciplinas:", discError);
    }
    const { data: progresso, error: progError } = await supabase
      .from("progresso_horas")
      .select("*")
      .eq("user_id", user.id)
      .gte("data_registro", dataInicioISO)
      .order("data_registro", { ascending: true });
    if (progError) {
      console.error("Erro ao buscar progresso:", progError);
    }
    const { data: avaliacoes, error: avalError } = await supabase
      .from("avaliacoes")
      .select("id, disciplina_id, nota, peso, data_iso, tipo")
      .eq("user_id", user.id)
      .not("nota", "is", null)
      .order("data_iso", { ascending: true });
    if (avalError) {
      console.error("Erro ao buscar avaliações:", avalError);
    }
    const { data: tarefas, error: tarefasError } = await supabase
      .from("tarefas")
      .select("id, disciplina_id, concluida, created_at")
      .eq("user_id", user.id)
      .gte("created_at", dataInicioISO);
    if (tarefasError) {
      console.error("Erro ao buscar tarefas:", tarefasError);
    }
    const horasPorDisciplina = (disciplinas || []).map((disc) => {
      const progressoDisc = (progresso || []).filter(
        (p) => p.disciplina_id === disc.id
      );
      const totalHoras = progressoDisc.reduce(
        (acc, p) => acc + (p.blocos_assistidos || 0) * (p.horas_por_bloco || 2),
        0
      );
      return {
        disciplinaId: disc.id,
        disciplinaNome: disc.nome,
        horasEstudadas: totalHoras,
        horasSemana: disc.horas_semana || 0,
        diasAtivos: new Set(progressoDisc.map((p) => p.data_registro)).size,
      };
    });
    const evolucaoMedias = (disciplinas || []).map((disc) => {
      const avalDisc = (avaliacoes || []).filter(
        (a) => a.disciplina_id === disc.id
      );
      if (avalDisc.length === 0) {
        return {
          disciplinaId: disc.id,
          disciplinaNome: disc.nome,
          medias: [],
        };
      }
      const mediasPorMes: Record<string, { soma: number; count: number }> = {};
      avalDisc.forEach((av) => {
        const data = new Date(av.data_iso);
        const mes = `${data.getFullYear()}-${String(
          data.getMonth() + 1
        ).padStart(2, "0")}`;
        if (!mediasPorMes[mes]) {
          mediasPorMes[mes] = { soma: 0, count: 0 };
        }
        mediasPorMes[mes].soma += av.nota || 0;
        mediasPorMes[mes].count += 1;
      });
      const medias = Object.entries(mediasPorMes)
        .map(([mes, dados]) => ({
          mes,
          media: dados.soma / dados.count,
        }))
        .sort((a, b) => a.mes.localeCompare(b.mes));
      return {
        disciplinaId: disc.id,
        disciplinaNome: disc.nome,
        medias,
      };
    });
    const tarefasConcluidas = (tarefas || []).filter((t) => t.concluida).length;
    const tarefasTotal = (tarefas || []).length;
    const taxaConclusao =
      tarefasTotal > 0 ? (tarefasConcluidas / tarefasTotal) * 100 : 0;
    const horasPorSemana: Record<string, number> = {};
    (progresso || []).forEach((p) => {
      const data = new Date(p.data_registro);
      const semana = getWeekNumber(data);
      const key = `${data.getFullYear()}-W${semana}`;
      const horas = (p.blocos_assistidos || 0) * (p.horas_por_bloco || 2);
      horasPorSemana[key] = (horasPorSemana[key] || 0) + horas;
    });
    const horasPorSemanaArray = Object.entries(horasPorSemana)
      .map(([semana, horas]) => ({ semana, horas }))
      .sort((a, b) => a.semana.localeCompare(b.semana));
    const distribuicaoCarga = (disciplinas || []).map((disc) => ({
      nome: disc.nome,
      horasSemana: disc.horas_semana || 0,
      tipo: disc.tipo,
    }));
    const comparativoDesempenho = (disciplinas || []).map((disc) => {
      const avalDisc = (avaliacoes || []).filter(
        (a) => a.disciplina_id === disc.id
      );
      if (avalDisc.length === 0) {
        return {
          disciplinaId: disc.id,
          disciplinaNome: disc.nome,
          media: null,
          totalAvaliacoes: 0,
        };
      }
      let somaPonderada = 0;
      let somaPesos = 0;
      avalDisc.forEach((av) => {
        const peso = av.peso || 1;
        somaPonderada += (av.nota || 0) * peso;
        somaPesos += peso;
      });
      const media = somaPesos > 0 ? somaPonderada / somaPesos : null;
      return {
        disciplinaId: disc.id,
        disciplinaNome: disc.nome,
        media: media !== null ? Number(media.toFixed(2)) : null,
        totalAvaliacoes: avalDisc.length,
      };
    });
    const heatmapData: Record<string, number> = {};
    (progresso || []).forEach((p) => {
      const data = p.data_registro;
      const horas = (p.blocos_assistidos || 0) * (p.horas_por_bloco || 2);
      heatmapData[data] = (heatmapData[data] || 0) + horas;
    });
    const heatmapCompleto: Array<{ date: string; value: number }> = [];
    const hoje = new Date();
    for (let i = 0; i < dias; i++) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      const dataStr = data.toISOString().split("T")[0];
      heatmapCompleto.push({
        date: dataStr,
        value: heatmapData[dataStr] || 0,
      });
    }
    heatmapCompleto.reverse();
    return NextResponse.json({
      horasPorDisciplina,
      evolucaoMedias,
      produtividade: {
        tarefasConcluidas,
        tarefasTotal,
        taxaConclusao: Number(taxaConclusao.toFixed(2)),
      },
      horasPorSemana: horasPorSemanaArray,
      distribuicaoCarga,
      comparativoDesempenho,
      heatmap: heatmapCompleto,
      periodo: dias,
    });
  } catch (error: any) {
    console.error("Erro na API de estatísticas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}