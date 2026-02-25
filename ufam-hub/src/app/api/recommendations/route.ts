import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

type RecommendationType =
  | "disciplina_estudar"
  | "anotacao_revisar"
  | "flashcard_revisar"
  | "material_biblioteca"
  | "grupo_estudo"
  | "usuario_seguir"
  | "tarefa_prioritaria"
  | "avaliacao_preparar";

interface Recommendation {
  id: string;
  tipo: RecommendationType;
  titulo: string;
  descricao: string;
  prioridade: number; // 0-5
  acao_url?: string;
  acao_label?: string;
  metadata?: Record<string, any>;
  baseado_em: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    const limit = parseInt(searchParams.get("limit") || "10");

    const recommendations: Recommendation[] = [];

    if (!tipo || tipo === "disciplina_estudar") {
      const disciplinasRec = await getDisciplinasParaEstudar(
        supabase,
        user.id,
        limit
      );
      recommendations.push(...disciplinasRec);
    }

    if (!tipo || tipo === "anotacao_revisar") {
      const anotacoesRec = await getAnotacoesParaRevisar(
        supabase,
        user.id,
        limit
      );
      recommendations.push(...anotacoesRec);
    }

    if (!tipo || tipo === "flashcard_revisar") {
      const flashcardsRec = await getFlashcardsParaRevisar(
        supabase,
        user.id,
        limit
      );
      recommendations.push(...flashcardsRec);
    }

    if (!tipo || tipo === "material_biblioteca") {
      const materiaisRec = await getMateriaisBiblioteca(
        supabase,
        user.id,
        limit
      );
      recommendations.push(...materiaisRec);
    }

    if (!tipo || tipo === "grupo_estudo") {
      const gruposRec = await getGruposEstudo(supabase, user.id, limit);
      recommendations.push(...gruposRec);
    }

    if (!tipo || tipo === "usuario_seguir") {
      const usuariosRec = await getUsuariosParaSeguir(
        supabase,
        user.id,
        limit
      );
      recommendations.push(...usuariosRec);
    }

    if (!tipo || tipo === "tarefa_prioritaria") {
      const tarefasRec = await getTarefasPrioritarias(
        supabase,
        user.id,
        limit
      );
      recommendations.push(...tarefasRec);
    }

    if (!tipo || tipo === "avaliacao_preparar") {
      const avaliacoesRec = await getAvaliacoesParaPreparar(
        supabase,
        user.id,
        limit
      );
      recommendations.push(...avaliacoesRec);
    }

    recommendations.sort((a, b) => b.prioridade - a.prioridade);

    return NextResponse.json({
      recommendations: recommendations.slice(0, limit),
      total: recommendations.length,
    });
  } catch (error: any) {
    console.error("Erro na API de recomendações:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

async function getDisciplinasParaEstudar(
  supabase: any,
  userId: string,
  limit: number
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  const { data: disciplinas } = await supabase
    .from("disciplinas")
    .select("id, nome, tipo")
    .eq("user_id", userId);

  if (!disciplinas || disciplinas.length === 0) return recommendations;

  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

  const { data: progresso } = await supabase
    .from("progresso_horas")
    .select("disciplina_id, data_registro, blocos_assistidos")
    .eq("user_id", userId)
    .gte("data_registro", seteDiasAtras.toISOString());

  const hoje = new Date();
  const proximos7Dias = new Date();
  proximos7Dias.setDate(hoje.getDate() + 7);

  const { data: avaliacoes } = await supabase
    .from("avaliacoes")
    .select("id, disciplina_id, tipo, data_iso")
    .eq("user_id", userId)
    .gte("data_iso", hoje.toISOString())
    .lte("data_iso", proximos7Dias.toISOString());

  const horasPorDisciplina: Record<string, number> = {};
  progresso?.forEach((p: any) => {
    const horas = (p.blocos_assistidos || 0) * 2; // Assumindo 2h por bloco
    horasPorDisciplina[p.disciplina_id] =
      (horasPorDisciplina[p.disciplina_id] || 0) + horas;
  });

  const disciplinasComAvaliacoes = new Set(
    avaliacoes?.map((a: any) => a.disciplina_id) || []
  );

  disciplinas.forEach((disc: any) => {
    const horasEstudadas = horasPorDisciplina[disc.id] || 0;
    const temAvaliacao = disciplinasComAvaliacoes.has(disc.id);

    if (horasEstudadas < 5 || temAvaliacao) {
      let prioridade = 3;
      let baseadoEm = "historico_estudo";

      if (temAvaliacao) {
        prioridade = 5;
        baseadoEm = "avaliacao_proxima";
      } else if (horasEstudadas === 0) {
        prioridade = 4;
        baseadoEm = "sem_estudo_recente";
      }

      recommendations.push({
        id: `disc_${disc.id}`,
        tipo: "disciplina_estudar",
        titulo: `Estudar ${disc.nome}`,
        descricao: temAvaliacao
          ? `Você tem uma avaliação próxima nesta disciplina. Considere revisar os conteúdos.`
          : horasEstudadas === 0
          ? `Você não estudou esta disciplina nos últimos 7 dias.`
          : `Você estudou apenas ${horasEstudadas}h esta semana.`,
        prioridade,
        acao_url: `/disciplinas/${disc.id}`,
        acao_label: "Ir para disciplina",
        metadata: { disciplina_id: disc.id, horas_estudadas: horasEstudadas },
        baseado_em: baseadoEm,
      });
    }
  });

  return recommendations;
}

async function getAnotacoesParaRevisar(
  supabase: any,
  userId: string,
  limit: number
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

  const { data: anotacoes } = await supabase
    .from("notas")
    .select("id, titulo, disciplina_id, updated_at, created_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: true })
    .limit(limit * 2);

  if (!anotacoes || anotacoes.length === 0) return recommendations;

  anotacoes.forEach((nota: any) => {
    const diasDesdeAtualizacao = Math.floor(
      (Date.now() - new Date(nota.updated_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (diasDesdeAtualizacao >= 7) {
      const prioridade = diasDesdeAtualizacao >= 30 ? 4 : 3;

      recommendations.push({
        id: `nota_${nota.id}`,
        tipo: "anotacao_revisar",
        titulo: `Revisar: ${nota.titulo}`,
        descricao: `Esta anotação não foi atualizada há ${diasDesdeAtualizacao} dias. Considere revisá-la.`,
        prioridade,
        acao_url: nota.disciplina_id
          ? `/disciplinas/${nota.disciplina_id}?nota=${nota.id}`
          : `/disciplinas/${nota.disciplina_id}`,
        acao_label: "Ver anotação",
        metadata: {
          nota_id: nota.id,
          disciplina_id: nota.disciplina_id,
          dias_sem_atualizar: diasDesdeAtualizacao,
        },
        baseado_em: "tempo_sem_revisar",
      });
    }
  });

  return recommendations.slice(0, limit);
}

async function getFlashcardsParaRevisar(
  supabase: any,
  userId: string,
  limit: number
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  const { data: flashcards } = await supabase
    .from("flashcards")
    .select("id, frente, disciplina_id, proxima_revisao, nivel")
    .eq("user_id", userId)
    .lte("proxima_revisao", new Date().toISOString())
    .order("proxima_revisao", { ascending: true })
    .limit(limit);

  if (!flashcards || flashcards.length === 0) return recommendations;

  const porDisciplina: Record<string, any[]> = {};
  flashcards.forEach((fc: any) => {
    const discId = fc.disciplina_id || "sem_disciplina";
    if (!porDisciplina[discId]) porDisciplina[discId] = [];
    porDisciplina[discId].push(fc);
  });

  Object.entries(porDisciplina).forEach(([discId, fcs]) => {
    const quantidade = fcs.length;
    const prioridade = quantidade >= 20 ? 5 : quantidade >= 10 ? 4 : 3;

    recommendations.push({
      id: `flashcards_${discId}`,
      tipo: "flashcard_revisar",
      titulo: `${quantidade} flashcard(s) precisam de revisão`,
      descricao: `Você tem ${quantidade} flashcard(s) vencidos para revisão. A revisão espaçada ajuda na retenção de conhecimento.`,
      prioridade,
      acao_url: discId !== "sem_disciplina" ? `/revisao?disciplina=${discId}` : "/revisao",
      acao_label: "Revisar flashcards",
      metadata: {
        disciplina_id: discId !== "sem_disciplina" ? discId : null,
        quantidade,
        flashcards_ids: fcs.map((f: any) => f.id),
      },
      baseado_em: "algoritmo_espacamento",
    });
  });

  return recommendations.slice(0, limit);
}

async function getMateriaisBiblioteca(
  supabase: any,
  userId: string,
  limit: number
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  const { data: disciplinas } = await supabase
    .from("disciplinas")
    .select("id, nome")
    .eq("user_id", userId)
    .limit(5);

  if (!disciplinas || disciplinas.length === 0) return recommendations;

  const disciplinaIds = disciplinas.map((d: any) => d.id);

  const { data: materiais, error: materiaisError } = await supabase
    .from("biblioteca_materiais")
    .select("id, titulo, descricao, disciplina_id, tipo, created_at")
    .in("disciplina_id", disciplinaIds)
    .eq("visibilidade", "public")
    .order("created_at", { ascending: false })
    .limit(limit);
  
  if (materiaisError && materiaisError.code !== "42P01") {
    console.error("Erro ao buscar materiais:", materiaisError);
  }

  if (!materiais || materiais.length === 0) return recommendations;

  materiais.forEach((material: any) => {
    const disciplina = disciplinas.find(
      (d: any) => d.id === material.disciplina_id
    );

    recommendations.push({
      id: `material_${material.id}`,
      tipo: "material_biblioteca",
      titulo: material.titulo,
      descricao: material.descricao || `Material de ${disciplina?.nome || "estudo"}`,
      prioridade: 3,
      acao_url: `/biblioteca/${material.id}`,
      acao_label: "Ver material",
      metadata: {
        material_id: material.id,
        disciplina_id: material.disciplina_id,
        tipo: material.tipo,
      },
      baseado_em: "disciplina_comum",
    });
  });

  return recommendations;
}

async function getGruposEstudo(
  supabase: any,
  userId: string,
  limit: number
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  const { data: disciplinas } = await supabase
    .from("disciplinas")
    .select("id, nome")
    .eq("user_id", userId)
    .limit(5);

  if (!disciplinas || disciplinas.length === 0) return recommendations;

  const disciplinaIds = disciplinas.map((d: any) => d.id);

  const { data: grupos, error: gruposError } = await supabase
    .from("grupos")
    .select("id, nome, descricao, disciplina_id, membros_count")
    .in("disciplina_id", disciplinaIds)
    .eq("visibilidade", "public")
    .order("membros_count", { ascending: false })
    .limit(limit);
  
  if (gruposError && gruposError.code !== "42P01") {
    console.error("Erro ao buscar grupos:", gruposError);
  }

  if (!grupos || grupos.length === 0) return recommendations;

  grupos.forEach((grupo: any) => {
    const disciplina = disciplinas.find(
      (d: any) => d.id === grupo.disciplina_id
    );

    recommendations.push({
      id: `grupo_${grupo.id}`,
      tipo: "grupo_estudo",
      titulo: grupo.nome,
      descricao: grupo.descricao || `Grupo de estudo de ${disciplina?.nome || "estudo"}`,
      prioridade: grupo.membros_count > 10 ? 4 : 3,
      acao_url: `/grupos/${grupo.id}`,
      acao_label: "Ver grupo",
      metadata: {
        grupo_id: grupo.id,
        disciplina_id: grupo.disciplina_id,
        membros_count: grupo.membros_count,
      },
      baseado_em: "disciplina_comum",
    });
  });

  return recommendations;
}

async function getUsuariosParaSeguir(
  supabase: any,
  userId: string,
  limit: number
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  const { data: disciplinas } = await supabase
    .from("disciplinas")
    .select("id, nome")
    .eq("user_id", userId);

  if (!disciplinas || disciplinas.length === 0) return recommendations;

  const disciplinaIds = disciplinas.map((d: any) => d.id);

  const { data: seguindo } = await supabase
    .from("followers")
    .select("following_id")
    .eq("follower_id", userId);

  const seguindoIds = new Set(seguindo?.map((s: any) => s.following_id) || []);
  seguindoIds.add(userId); // Excluir a si mesmo

  const seguindoIdsArray = Array.from(seguindoIds);
  let query = supabase
    .from("disciplinas")
    .select("user_id")
    .in("id", disciplinaIds)
    .neq("user_id", userId);
  
  if (seguindoIdsArray.length > 0) {
    query = query.not("user_id", "in", `(${seguindoIdsArray.join(",")})`);
  }
  
  const { data: outrosUsuarios } = await query.limit(limit * 2);

  if (!outrosUsuarios || outrosUsuarios.length === 0) return recommendations;

  const comumPorUsuario: Record<string, number> = {};
  outrosUsuarios.forEach((d: any) => {
    comumPorUsuario[d.user_id] = (comumPorUsuario[d.user_id] || 0) + 1;
  });

  const topUsuarios = Object.entries(comumPorUsuario)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([userId]) => userId);

  const { data: usuarios } = await supabase
    .from("profiles")
    .select("id, nome, avatar_url")
    .in("id", topUsuarios);

  usuarios?.forEach((usuario: any) => {
    const disciplinasComuns = comumPorUsuario[usuario.id];

    recommendations.push({
      id: `usuario_${usuario.id}`,
      tipo: "usuario_seguir",
      titulo: `Seguir ${usuario.nome || "Usuário"}`,
      descricao: `Vocês têm ${disciplinasComuns} disciplina(s) em comum.`,
      prioridade: disciplinasComuns >= 3 ? 4 : 3,
      acao_url: `/perfil/${usuario.id}`,
      acao_label: "Ver perfil",
      metadata: {
        usuario_id: usuario.id,
        disciplinas_comuns: disciplinasComuns,
      },
      baseado_em: "interesses_similares",
    });
  });

  return recommendations;
}

async function getTarefasPrioritarias(
  supabase: any,
  userId: string,
  limit: number
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  const hoje = new Date();
  const proximos3Dias = new Date();
  proximos3Dias.setDate(hoje.getDate() + 3);

  const { data: tarefas } = await supabase
    .from("tarefas")
    .select("id, titulo, disciplina_id, prazo, prioridade")
    .eq("user_id", userId)
    .eq("concluida", false)
    .lte("prazo", proximos3Dias.toISOString())
    .order("prazo", { ascending: true })
    .limit(limit);

  if (!tarefas || tarefas.length === 0) return recommendations;

  tarefas.forEach((tarefa: any) => {
    const prazo = new Date(tarefa.prazo);
    const diasRestantes = Math.floor(
      (prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
    );

    let prioridade = 3;
    if (diasRestantes < 0) {
      prioridade = 5; // Vencida
    } else if (diasRestantes === 0) {
      prioridade = 5; // Vence hoje
    } else if (diasRestantes === 1) {
      prioridade = 4; // Vence amanhã
    }

    recommendations.push({
      id: `tarefa_${tarefa.id}`,
      tipo: "tarefa_prioritaria",
      titulo: tarefa.titulo,
      descricao:
        diasRestantes < 0
          ? `Esta tarefa está vencida há ${Math.abs(diasRestantes)} dia(s).`
          : diasRestantes === 0
          ? "Esta tarefa vence hoje!"
          : `Esta tarefa vence em ${diasRestantes} dia(s).`,
      prioridade,
      acao_url: tarefa.disciplina_id
        ? `/disciplinas/${tarefa.disciplina_id}?tarefa=${tarefa.id}`
        : "/disciplinas",
      acao_label: "Ver tarefa",
      metadata: {
        tarefa_id: tarefa.id,
        disciplina_id: tarefa.disciplina_id,
        prazo: tarefa.prazo,
        dias_restantes: diasRestantes,
      },
      baseado_em: "prazo_proximo",
    });
  });

  return recommendations;
}

async function getAvaliacoesParaPreparar(
  supabase: any,
  userId: string,
  limit: number
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  const hoje = new Date();
  const proximos7Dias = new Date();
  proximos7Dias.setDate(hoje.getDate() + 7);

  const { data: avaliacoes } = await supabase
    .from("avaliacoes")
    .select("id, tipo, disciplina_id, data_iso, descricao")
    .eq("user_id", userId)
    .gte("data_iso", hoje.toISOString())
    .lte("data_iso", proximos7Dias.toISOString())
    .order("data_iso", { ascending: true })
    .limit(limit);

  if (!avaliacoes || avaliacoes.length === 0) return recommendations;

  avaliacoes.forEach((avaliacao: any) => {
    const dataAvaliacao = new Date(avaliacao.data_iso);
    const diasRestantes = Math.floor(
      (dataAvaliacao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
    );

    const prioridade = diasRestantes <= 2 ? 5 : diasRestantes <= 4 ? 4 : 3;

    recommendations.push({
      id: `avaliacao_${avaliacao.id}`,
      tipo: "avaliacao_preparar",
      titulo: `${avaliacao.tipo.charAt(0).toUpperCase() + avaliacao.tipo.slice(1)} em ${diasRestantes} dia(s)`,
      descricao: avaliacao.descricao || `Prepare-se para sua ${avaliacao.tipo}.`,
      prioridade,
      acao_url: `/disciplinas/${avaliacao.disciplina_id}?avaliacao=${avaliacao.id}`,
      acao_label: "Ver avaliação",
      metadata: {
        avaliacao_id: avaliacao.id,
        disciplina_id: avaliacao.disciplina_id,
        tipo: avaliacao.tipo,
        data_iso: avaliacao.data_iso,
        dias_restantes: diasRestantes,
      },
      baseado_em: "avaliacao_proxima",
    });
  });

  return recommendations;
}
