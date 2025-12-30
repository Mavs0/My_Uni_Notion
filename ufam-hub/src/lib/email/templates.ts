export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Template base reutilizável com design moderno
function getBaseEmailStyles() {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    }
    .email-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
      color: #ffffff;
    }
    .email-header h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: #ffffff;
    }
    .email-header p {
      font-size: 14px;
      opacity: 0.95;
      margin: 0;
    }
    .email-content {
      padding: 40px 30px;
    }
    .email-greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 24px;
    }
    .info-card {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-left: 4px solid #667eea;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .info-row {
      display: flex;
      align-items: flex-start;
      margin: 12px 0;
      gap: 12px;
    }
    .info-label {
      font-weight: 600;
      color: #6b7280;
      min-width: 120px;
      font-size: 14px;
    }
    .info-value {
      color: #1f2937;
      font-size: 14px;
      flex: 1;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-prova {
      background-color: #fee2e2;
      color: #dc2626;
    }
    .badge-trabalho {
      background-color: #dbeafe;
      color: #2563eb;
    }
    .badge-seminario {
      background-color: #d1fae5;
      color: #059669;
    }
    .badge-tarefa {
      background-color: #fef3c7;
      color: #d97706;
    }
    .badge-lembrete {
      background-color: #e0e7ff;
      color: #6366f1;
    }
    .badge-conquista {
      background-color: #fce7f3;
      color: #db2777;
    }
    .cta-button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }
    .email-footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .email-footer p {
      font-size: 12px;
      color: #6b7280;
      margin: 8px 0;
    }
    .email-footer a {
      color: #667eea;
      text-decoration: none;
    }
    .urgency-banner {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-left: 4px solid #f59e0b;
      padding: 16px 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .urgency-banner p {
      margin: 0;
      color: #92400e;
      font-weight: 600;
      font-size: 14px;
    }
    @media only screen and (max-width: 600px) {
      body {
        padding: 10px;
      }
      .email-content {
        padding: 30px 20px;
      }
      .info-row {
        flex-direction: column;
        gap: 4px;
      }
      .info-label {
        min-width: auto;
      }
    }
  `;
}

function wrapEmailTemplate(content: string, headerText: string, headerIcon: string = "📚"): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${getBaseEmailStyles()}</style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      <h1>${headerIcon} UFAM Hub</h1>
      <p>${headerText}</p>
    </div>
    <div class="email-content">
      ${content}
    </div>
    <div class="email-footer">
      <p><strong>UFAM Hub</strong> - Organize seus estudos de forma inteligente</p>
      <p>
        <a href="${appUrl}">Acessar plataforma</a> | 
        <a href="${appUrl}/configuracoes">Gerenciar notificações</a>
      </p>
      <p style="margin-top: 16px; font-size: 11px; color: #9ca3af;">
        Esta é uma notificação automática. Você pode gerenciar suas preferências nas configurações.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
export function createAvaliacaoProximaEmail(data: {
  disciplina: string;
  tipo: string;
  data: string;
  horario?: string;
  descricao?: string;
  diasRestantes: number;
}): EmailTemplate {
  const {
    disciplina,
    tipo,
    data: dataISO,
    horario,
    descricao,
    diasRestantes,
  } = data;
  const dataFormatada = new Date(dataISO).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const tipoFormatado = tipo.charAt(0).toUpperCase() + tipo.slice(1);
  const diasTexto =
    diasRestantes === 0
      ? "hoje"
      : diasRestantes === 1
      ? "amanhã"
      : `em ${diasRestantes} dias`;
  const subject = `📚 ${tipoFormatado} de ${disciplina} ${diasTexto}`;
  
  const urgencyBanner = diasRestantes === 0 
    ? `<div class="urgency-banner">
        <p>⚠️ Esta avaliação é hoje! Não se esqueça!</p>
      </div>`
    : diasRestantes === 1
    ? `<div class="urgency-banner">
        <p>⏰ Esta avaliação é amanhã! Prepare-se!</p>
      </div>`
    : "";

  const content = `
    <p class="email-greeting">Olá! 👋</p>
    <p style="font-size: 16px; margin-bottom: 20px;">
      Você tem uma <strong>${tipoFormatado}</strong> de <strong>${disciplina}</strong> ${diasTexto}.
    </p>
    ${urgencyBanner}
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Disciplina:</span>
        <span class="info-value"><strong>${disciplina}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Tipo:</span>
        <span class="info-value">
          <span class="badge badge-${tipo}">${tipoFormatado}</span>
        </span>
      </div>
      <div class="info-row">
        <span class="info-label">Data:</span>
        <span class="info-value">${dataFormatada}${horario ? ` às ${horario}` : ""}</span>
      </div>
      ${descricao ? `
      <div class="info-row">
        <span class="info-label">Descrição:</span>
        <span class="info-value">${descricao}</span>
      </div>
      ` : ""}
      <div class="info-row">
        <span class="info-label">Tempo restante:</span>
        <span class="info-value"><strong style="font-size: 16px; color: #667eea;">${diasRestantes}</strong> ${diasRestantes === 1 ? "dia" : "dias"}</span>
      </div>
    </div>
    <p style="margin-top: 24px; font-size: 15px; color: #4b5563;">
      Boa sorte nos seus estudos! 🎓
    </p>
    <div style="text-align: center; margin-top: 32px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/avaliacoes" class="cta-button">
        Ver Detalhes da Avaliação
      </a>
    </div>
  `;

  const html = wrapEmailTemplate(content, "Notificação de Avaliação", "📚");
  const text = `
UFAM Hub - Notificação de Avaliação
Olá!
Você tem uma ${tipoFormatado} de ${disciplina} ${diasTexto}.
Disciplina: ${disciplina}
Tipo: ${tipoFormatado}
Data: ${dataFormatada}${horario ? ` às ${horario}` : ""}
${descricao ? `Descrição: ${descricao}\n` : ""}
Dias restantes: ${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"}
Boa sorte nos seus estudos! 🎓
Acesse: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/avaliacoes
---
Esta é uma notificação automática do UFAM Hub.
Você pode gerenciar suas preferências de notificação nas configurações.
  `;
  return { subject, html, text };
}
export function createEventoProximoEmail(data: {
  titulo: string;
  tipo: "aula" | "evento";
  data: string;
  horario?: string;
  local?: string;
  diasRestantes: number;
}): EmailTemplate {
  const { titulo, tipo, data: dataISO, horario, local, diasRestantes } = data;
  const dataFormatada = new Date(dataISO).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const tipoFormatado = tipo === "aula" ? "Aula" : "Evento";
  const diasTexto =
    diasRestantes === 0
      ? "hoje"
      : diasRestantes === 1
      ? "amanhã"
      : `em ${diasRestantes} dias`;
  const subject = `📅 ${tipoFormatado}: ${titulo} ${diasTexto}`;
  
  const content = `
    <p class="email-greeting">Olá! 👋</p>
    <p style="font-size: 16px; margin-bottom: 20px;">
      Você tem um <strong>${tipoFormatado}</strong> ${diasTexto}: <strong>${titulo}</strong>
    </p>
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Título:</span>
        <span class="info-value"><strong>${titulo}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Data:</span>
        <span class="info-value">${dataFormatada}${horario ? ` às ${horario}` : ""}</span>
      </div>
      ${local ? `
      <div class="info-row">
        <span class="info-label">Local:</span>
        <span class="info-value">${local}</span>
      </div>
      ` : ""}
      <div class="info-row">
        <span class="info-label">Tempo restante:</span>
        <span class="info-value"><strong style="font-size: 16px; color: #667eea;">${diasRestantes}</strong> ${diasRestantes === 1 ? "dia" : "dias"}</span>
      </div>
    </div>
    <div style="text-align: center; margin-top: 32px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/grade" class="cta-button">
        Ver Calendário
      </a>
    </div>
  `;

  const html = wrapEmailTemplate(content, `Notificação de ${tipoFormatado}`, "📅");
  const text = `
UFAM Hub - Notificação de ${tipoFormatado}
Olá!
Você tem um ${tipoFormatado} ${diasTexto}: ${titulo}
Título: ${titulo}
Data: ${dataFormatada}${horario ? ` às ${horario}` : ""}
${local ? `Local: ${local}\n` : ""}
Dias restantes: ${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"}
Acesse: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/calendar
---
Esta é uma notificação automática do UFAM Hub.
Você pode gerenciar suas preferências de notificação nas configurações.
  `;
  return { subject, html, text };
}
export function createConfirmacaoEmail(data: {
  nome?: string;
  email: string;
  confirmationLink: string;
}): EmailTemplate {
  const { nome, email, confirmationLink } = data;
  const nomeFormatado = nome || "estudante";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const subject = "🎓 Confirme seu email - UFAM Hub";
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e5e5;
    }
    .logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin-bottom: 20px;
    }
    .header h1 {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      margin-bottom: 30px;
    }
    .welcome-text {
      font-size: 18px;
      color: #333;
      margin-bottom: 20px;
    }
    .message-box {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 25px 0;
      border-radius: 8px;
    }
    .message-box p {
      margin: 0;
      color: #333;
      font-size: 15px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 16px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }
    .info-box {
      background-color: #f8f9fa;
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
    }
    .info-text {
      font-size: 13px;
      color: #666;
      margin: 5px 0;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e5e5;
      color: #666;
      font-size: 12px;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #e5e5e5, transparent);
      margin: 25px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <span style="font-size: 32px; color: white;">🎓</span>
      </div>
      <h1>UFAM Hub</h1>
      <p style="color: #666; margin-top: 8px;">Organizador acadêmico pessoal com IA</p>
    </div>
    <div class="content">
      <p class="welcome-text">Olá, <strong>${nomeFormatado}</strong>! 👋</p>
      <p>Bem-vindo ao <strong>UFAM Hub</strong>! Estamos muito felizes em tê-lo conosco.</p>
      <div class="message-box">
        <p><strong>Por favor, confirme seu email</strong> para ativar sua conta e começar a organizar seus estudos.</p>
      </div>
      <p>Clique no botão abaixo para confirmar seu endereço de email:</p>
      <div class="button-container">
        <a href="${confirmationLink}" class="button">
          Confirmar Email
        </a>
      </div>
      <div class="divider"></div>
      <div class="info-box">
        <p class="info-text"><strong>Não consegue clicar no botão?</strong></p>
        <p class="info-text">Você também pode confirmar seu email acessando a plataforma e fazendo login. O link de confirmação também foi enviado pelo Supabase.</p>
        <p class="info-text" style="margin-top: 10px;">
          Ou copie e cole o link abaixo no seu navegador:
        </p>
        <p class="info-text" style="word-break: break-all; color: #667eea; font-family: monospace; font-size: 11px; margin-top: 5px;">
          ${confirmationLink}
        </p>
      </div>
      <p style="margin-top: 25px; color: #666; font-size: 14px;">
        <strong>Importante:</strong> Você receberá também um email do Supabase com o link oficial de confirmação. Use qualquer um dos dois links para confirmar sua conta.
      </p>
      <p style="margin-top: 15px; color: #666; font-size: 14px;">
        Se você não criou uma conta no UFAM Hub, pode ignorar este email com segurança.
      </p>
    </div>
    <div class="footer">
      <p><strong>UFAM Hub</strong></p>
      <p>Organize seus estudos de forma inteligente</p>
      <p style="margin-top: 15px;">
        <a href="${appUrl}">Acessar plataforma</a>
      </p>
      <p style="margin-top: 20px; font-size: 11px; color: #999;">
        Este é um email automático. Por favor, não responda.
      </p>
    </div>
  </div>
</body>
</html>
  `;
  const text = `
UFAM Hub - Confirmação de Email
Olá, ${nomeFormatado}!
Bem-vindo ao UFAM Hub! Estamos muito felizes em tê-lo conosco.
Por favor, confirme seu email para ativar sua conta e começar a organizar seus estudos.
Clique no link abaixo para confirmar seu endereço de email:
${confirmationLink}
Se você não conseguir clicar no link, copie e cole o endereço acima no seu navegador.
Importante: Você receberá também um email do Supabase com o link oficial de confirmação. Use qualquer um dos dois links para confirmar sua conta.
Se você não criou uma conta no UFAM Hub, pode ignorar este email com segurança.
---
UFAM Hub - Organize seus estudos de forma inteligente
${appUrl}
  `;
  return { subject, html, text };
}

// Template para notificações de tarefas
export function createTarefaEmail(data: {
  titulo: string;
  disciplina?: string;
  prazo: string;
  prioridade?: "baixa" | "media" | "alta";
  diasRestantes: number;
}): EmailTemplate {
  const { titulo, disciplina, prazo, prioridade = "media", diasRestantes } = data;
  const prazoFormatado = new Date(prazo).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  
  const prioridadeTexto = prioridade === "alta" ? "Alta" : prioridade === "baixa" ? "Baixa" : "Média";
  const prioridadeCor = prioridade === "alta" ? "#dc2626" : prioridade === "baixa" ? "#6b7280" : "#f59e0b";
  
  const urgencyBanner = diasRestantes === 0 
    ? `<div class="urgency-banner">
        <p>⚠️ Esta tarefa vence hoje! Complete-a o quanto antes!</p>
      </div>`
    : diasRestantes === 1
    ? `<div class="urgency-banner">
        <p>⏰ Esta tarefa vence amanhã! Não deixe para última hora!</p>
      </div>`
    : "";

  const subject = `✅ Tarefa: ${titulo}${diasRestantes === 0 ? " (Vence hoje!)" : diasRestantes === 1 ? " (Vence amanhã!)" : ""}`;
  
  const content = `
    <p class="email-greeting">Olá! 👋</p>
    <p style="font-size: 16px; margin-bottom: 20px;">
      Você tem uma tarefa pendente: <strong>${titulo}</strong>
    </p>
    ${urgencyBanner}
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Tarefa:</span>
        <span class="info-value"><strong>${titulo}</strong></span>
      </div>
      ${disciplina ? `
      <div class="info-row">
        <span class="info-label">Disciplina:</span>
        <span class="info-value">${disciplina}</span>
      </div>
      ` : ""}
      <div class="info-row">
        <span class="info-label">Prazo:</span>
        <span class="info-value">${prazoFormatado}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Prioridade:</span>
        <span class="info-value">
          <span class="badge" style="background-color: ${prioridadeCor}20; color: ${prioridadeCor};">
            ${prioridadeTexto}
          </span>
        </span>
      </div>
      <div class="info-row">
        <span class="info-label">Tempo restante:</span>
        <span class="info-value"><strong style="font-size: 16px; color: #667eea;">${diasRestantes}</strong> ${diasRestantes === 1 ? "dia" : "dias"}</span>
      </div>
    </div>
    <div style="text-align: center; margin-top: 32px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/disciplinas" class="cta-button">
        Ver Tarefas
      </a>
    </div>
  `;

  const html = wrapEmailTemplate(content, "Notificação de Tarefa", "✅");
  
  const text = `
UFAM Hub - Notificação de Tarefa
Olá!
Você tem uma tarefa pendente: ${titulo}
${disciplina ? `Disciplina: ${disciplina}\n` : ""}Prazo: ${prazoFormatado}
Prioridade: ${prioridadeTexto}
Tempo restante: ${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"}
Acesse: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/disciplinas
  `;

  return { subject, html, text };
}

// Template para notificações de lembretes
export function createLembreteEmail(data: {
  titulo: string;
  descricao?: string;
  tipo: string;
  dataAgendada: string;
}): EmailTemplate {
  const { titulo, descricao, tipo, dataAgendada } = data;
  const dataFormatada = new Date(dataAgendada).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  
  const tipoFormatado = tipo.charAt(0).toUpperCase() + tipo.slice(1);
  
  const subject = `🔔 Lembrete: ${titulo}`;
  
  const content = `
    <p class="email-greeting">Olá! 👋</p>
    <p style="font-size: 16px; margin-bottom: 20px;">
      Você tem um lembrete agendado: <strong>${titulo}</strong>
    </p>
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Título:</span>
        <span class="info-value"><strong>${titulo}</strong></span>
      </div>
      ${descricao ? `
      <div class="info-row">
        <span class="info-label">Descrição:</span>
        <span class="info-value">${descricao}</span>
      </div>
      ` : ""}
      <div class="info-row">
        <span class="info-label">Tipo:</span>
        <span class="info-value">
          <span class="badge badge-lembrete">${tipoFormatado}</span>
        </span>
      </div>
      <div class="info-row">
        <span class="info-label">Agendado para:</span>
        <span class="info-value">${dataFormatada}</span>
      </div>
    </div>
    <div style="text-align: center; margin-top: 32px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/configuracoes" class="cta-button">
        Ver Lembretes
      </a>
    </div>
  `;

  const html = wrapEmailTemplate(content, "Lembrete", "🔔");
  
  const text = `
UFAM Hub - Lembrete
Olá!
Você tem um lembrete agendado: ${titulo}
${descricao ? `Descrição: ${descricao}\n` : ""}Tipo: ${tipoFormatado}
Agendado para: ${dataFormatada}
Acesse: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/configuracoes
  `;

  return { subject, html, text };
}

// Template para notificações de conquistas
export function createConquistaEmail(data: {
  nome: string;
  descricao: string;
  icone?: string;
}): EmailTemplate {
  const { nome, descricao, icone = "🏆" } = data;
  
  const subject = `${icone} Conquista Desbloqueada: ${nome}`;
  
  const content = `
    <p class="email-greeting">Parabéns! 🎉</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="font-size: 64px; margin-bottom: 16px;">${icone}</div>
      <h2 style="font-size: 24px; color: #1f2937; margin-bottom: 8px;">${nome}</h2>
      <p style="font-size: 16px; color: #6b7280;">${descricao}</p>
    </div>
    <div class="info-card" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left-color: #f59e0b;">
      <p style="text-align: center; margin: 0; font-size: 15px; color: #92400e;">
        <strong>Você desbloqueou uma nova conquista!</strong><br>
        Continue estudando para desbloquear mais conquistas! 🚀
      </p>
    </div>
    <div style="text-align: center; margin-top: 32px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" class="cta-button">
        Ver Minhas Conquistas
      </a>
    </div>
  `;

  const html = wrapEmailTemplate(content, "Conquista Desbloqueada", icone);
  
  const text = `
UFAM Hub - Conquista Desbloqueada
Parabéns! 🎉
Você desbloqueou uma nova conquista: ${nome}
${descricao}
Continue estudando para desbloquear mais conquistas! 🚀
Acesse: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard
  `;

  return { subject, html, text };
}