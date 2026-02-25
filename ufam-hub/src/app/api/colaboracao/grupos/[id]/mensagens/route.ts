import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";
function extractMentions(mensagem: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(mensagem)) !== null) {
    mentions.push(match[1]);
  }
  return [...new Set(mentions)]; // Remove duplicatas
}

async function findUserIdsByMentions(
  adminClient: any,
  grupoId: string,
  mentions: string[]
): Promise<string[]> {
  if (mentions.length === 0) return [];
  
  const userIds: string[] = [];
  
  const { data: membros } = await adminClient
    .from("grupo_membros")
    .select("user_id")
    .eq("grupo_id", grupoId)
    .eq("status", "ativo");
  
  if (!membros) return [];
  
  for (const mention of mentions) {
    for (const membro of membros) {
      try {
        const { data: userData } = await adminClient.auth.admin.getUserById(
          membro.user_id
        );
        if (userData?.user) {
          const nome = userData.user.user_metadata?.nome || "";
          const email = userData.user.email || "";
          const nomeLower = nome.toLowerCase().replace(/\s+/g, "");
          const emailLower = email.toLowerCase();
          const mentionLower = mention.toLowerCase();
          
          if (
            nomeLower.includes(mentionLower) ||
            emailLower.includes(mentionLower) ||
            nomeLower === mentionLower
          ) {
            userIds.push(membro.user_id);
            break;
          }
        }
      } catch (err) {
      }
    }
  }
  
  return [...new Set(userIds)]; // Remove duplicatas
}

async function sendNewMessageNotifications(
  adminClient: any,
  grupoId: string,
  mensagemId: string,
  senderId: string,
  grupoNome: string,
  mensagemTexto: string,
  mencionados: string[] = []
) {
  try {
    const { data: membros } = await adminClient
      .from("grupo_membros")
      .select("user_id")
      .eq("grupo_id", grupoId)
      .eq("status", "ativo")
      .neq("user_id", senderId);
    
    if (!membros || membros.length === 0) return;
    
    const { sendPushNotification } = await import("@/lib/push/notifications");
    
    let senderName = "Alguém";
    try {
      const { data: senderData } = await adminClient.auth.admin.getUserById(senderId);
      if (senderData?.user) {
        senderName = senderData.user.user_metadata?.nome || senderData.user.email || "Alguém";
      }
    } catch (err) {
    }
    
    for (const mencionadoId of mencionados) {
      if (mencionadoId === senderId) continue;
      
      try {
        await sendPushNotification(mencionadoId, {
          title: `${senderName} mencionou você em ${grupoNome}`,
          body: mensagemTexto.length > 100 
            ? `${mensagemTexto.substring(0, 100)}...` 
            : mensagemTexto,
          tag: `grupo-mention-${grupoId}-${mensagemId}`,
          data: {
            url: `/grupos/${grupoId}`,
            type: "grupo_mention",
            grupo_id: grupoId,
            mensagem_id: mensagemId,
          },
          requireInteraction: false,
        });
        
        await adminClient.from("notification_history").insert({
          user_id: mencionadoId,
          tipo: "grupo_mention",
          titulo: `${senderName} mencionou você em ${grupoNome}`,
          descricao: mensagemTexto,
          referencia_id: mensagemId,
          referencia_tipo: "grupo_mensagem",
        });
      } catch (err) {
        console.error("Erro ao enviar notificação de menção:", err);
      }
    }
    
    const outrosMembros = membros.filter(
      (m: any) => !mencionados.includes(m.user_id)
    );
    
    for (const membro of outrosMembros) {
      try {
        await sendPushNotification(membro.user_id, {
          title: `Nova mensagem em ${grupoNome}`,
          body: `${senderName}: ${mensagemTexto.length > 80 
            ? `${mensagemTexto.substring(0, 80)}...` 
            : mensagemTexto}`,
          tag: `grupo-message-${grupoId}-${mensagemId}`,
          data: {
            url: `/grupos/${grupoId}`,
            type: "grupo_message",
            grupo_id: grupoId,
            mensagem_id: mensagemId,
          },
          requireInteraction: false,
        });
      } catch (err) {
      }
    }
  } catch (error) {
    console.error("Erro ao enviar notificações de mensagem:", error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: grupo_id } = await params;
    const body = await request.json();
    const { mensagem, tipo, referencia_id } = body;
    if (!mensagem) {
      return NextResponse.json(
        { error: "mensagem é obrigatória" },
        { status: 400 }
      );
    }
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    let membro;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();
      const membroResult = await adminClient
        .from("grupo_membros")
        .select("id")
        .eq("grupo_id", grupo_id)
        .eq("user_id", user.id)
        .eq("status", "ativo")
        .single();
      membro = membroResult.data;
    } else {
      const membroResult = await supabase
        .from("grupo_membros")
        .select("id")
        .eq("grupo_id", grupo_id)
        .eq("user_id", user.id)
        .eq("status", "ativo")
        .single();
      membro = membroResult.data;
    }

    if (!membro) {
      return NextResponse.json(
        { error: "Você não é membro deste grupo" },
        { status: 403 }
      );
    }

    const mentions = extractMentions(mensagem);
    let mencionados: string[] = [];
    try {
      if (mentions.length > 0 && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const adminClient = createSupabaseAdmin();
        mencionados = await findUserIdsByMentions(adminClient, grupo_id, mentions);
      }
    } catch (err) {
      console.warn("Erro ao resolver menções (mensagem será enviada):", err);
    }

    let mensagemData, mensagemError;
    let grupoNome = "Grupo";

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();
      
      const { data: grupo } = await adminClient
        .from("grupos_estudo")
        .select("nome")
        .eq("id", grupo_id)
        .single();
      if (grupo) grupoNome = grupo.nome;
      
      const result = await adminClient
        .from("grupo_mensagens")
        .insert({
          grupo_id,
          user_id: user.id,
          mensagem,
          tipo: tipo || "texto",
          referencia_id: referencia_id || null,
        })
        .select("*")
        .single();
      mensagemData = result.data;
      mensagemError = result.error;

      if (mensagemData) {
        try {
          const { data: userData } = await adminClient.auth.admin.getUserById(
            (mensagemData as any).user_id
          );
          if (userData?.user) {
            (mensagemData as any).usuario = {
              id: userData.user.id,
              raw_user_meta_data: userData.user.user_metadata || {},
            };
          } else {
            (mensagemData as any).usuario = {
              id: (mensagemData as any).user_id,
              raw_user_meta_data: {},
            };
          }
        } catch (err) {
          (mensagemData as any).usuario = {
            id: (mensagemData as any).user_id,
            raw_user_meta_data: {},
          };
        }
        
        if (mensagemData.id) {
          sendNewMessageNotifications(
            adminClient,
            grupo_id,
            mensagemData.id,
            user.id,
            grupoNome,
            mensagem,
            mencionados
          ).catch(console.error);
        }
      }
    } else {
      const result = await supabase
        .from("grupo_mensagens")
        .insert({
          grupo_id,
          user_id: user.id,
          mensagem,
          tipo: tipo || "texto",
          referencia_id: referencia_id || null,
        })
        .select("*")
        .single();
      mensagemData = result.data;
      mensagemError = result.error;
    }
    if (mensagemError) {
      console.error("Erro ao enviar mensagem:", mensagemError);
      return NextResponse.json(
        {
          error: "Erro ao enviar mensagem",
          details: process.env.NODE_ENV === "development" ? String((mensagemError as { message?: string })?.message ?? mensagemError) : undefined,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, mensagem: mensagemData });
  } catch (error: any) {
    console.error("Erro na API de mensagens:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: grupo_id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    let membro;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();
      const membroResult = await adminClient
        .from("grupo_membros")
        .select("id")
        .eq("grupo_id", grupo_id)
        .eq("user_id", user.id)
        .eq("status", "ativo")
        .single();
      membro = membroResult.data;
    } else {
      const membroResult = await supabase
        .from("grupo_membros")
        .select("id")
        .eq("grupo_id", grupo_id)
        .eq("user_id", user.id)
        .eq("status", "ativo")
        .single();
      membro = membroResult.data;
    }

    if (!membro) {
      return NextResponse.json(
        { error: "Você não é membro deste grupo" },
        { status: 403 }
      );
    }

    let mensagens, error;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();
      const result = await adminClient
        .from("grupo_mensagens")
        .select("*")
        .eq("grupo_id", grupo_id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      mensagens = result.data;
      error = result.error;

      if (mensagens && mensagens.length > 0) {
        const userIds = [...new Set(mensagens.map((msg: any) => msg.user_id))];
        const usuariosMap = new Map();

        try {
          const adminClient = createSupabaseAdmin();
          for (const userId of userIds) {
            try {
              const { data: userData, error: userError } =
                await adminClient.auth.admin.getUserById(userId);
              if (!userError && userData?.user) {
                usuariosMap.set(userId, {
                  id: userData.user.id,
                  raw_user_meta_data: userData.user.user_metadata || {},
                });
              }
            } catch (err) {
              console.warn("Erro ao buscar usuário:", userId, err);
            }
          }
        } catch (err) {
          console.warn("Erro ao usar admin client para buscar usuários:", err);
        }

        for (const msg of mensagens) {
          (msg as any).usuario = usuariosMap.get((msg as any).user_id) || {
            id: (msg as any).user_id,
            raw_user_meta_data: {},
          };
        }
      }
    } else {
      const result = await supabase
        .from("grupo_mensagens")
        .select("*")
        .eq("grupo_id", grupo_id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      mensagens = result.data;
      error = result.error;

      if (
        mensagens &&
        mensagens.length > 0 &&
        process.env.SUPABASE_SERVICE_ROLE_KEY
      ) {
        const userIds = [...new Set(mensagens.map((msg: any) => msg.user_id))];
        const usuariosMap = new Map();

        try {
          const adminClient = createSupabaseAdmin();
          for (const userId of userIds) {
            try {
              const { data: userData, error: userError } =
                await adminClient.auth.admin.getUserById(userId);
              if (!userError && userData?.user) {
                usuariosMap.set(userId, {
                  id: userData.user.id,
                  raw_user_meta_data: userData.user.user_metadata || {},
                });
              }
            } catch (err) {
              console.warn("Erro ao buscar usuário:", userId, err);
            }
          }
        } catch (err) {
          console.warn("Erro ao usar admin client para buscar usuários:", err);
        }

        for (const msg of mensagens) {
          (msg as any).usuario = usuariosMap.get((msg as any).user_id) || {
            id: (msg as any).user_id,
            raw_user_meta_data: {},
          };
        }
      }
    }
    if (error) {
      console.error("Erro ao buscar mensagens:", error);
      return NextResponse.json(
        { error: "Erro ao buscar mensagens" },
        { status: 500 }
      );
    }
    return NextResponse.json({ mensagens: mensagens || [] });
  } catch (error: any) {
    console.error("Erro na API de mensagens:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
