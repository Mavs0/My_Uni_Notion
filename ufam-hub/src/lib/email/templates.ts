export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
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
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e5e5;
    }
    .header h1 {
      color: #2563eb;
      margin: 0;
      font-size: 24px;
    }
    .content {
      margin-bottom: 30px;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #2563eb;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-item {
      margin: 10px 0;
      display: flex;
      align-items: center;
    }
    .info-label {
      font-weight: 600;
      color: #666;
      min-width: 100px;
    }
    .info-value {
      color: #333;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
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
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e5e5e5;
      color: #666;
      font-size: 12px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #2563eb;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 UFAM Hub</h1>
      <p>Notificação de Avaliação</p>
    </div>
    <div class="content">
      <p>Olá!</p>
      <p>Você tem uma <strong>${tipoFormatado}</strong> de <strong>${disciplina}</strong> ${diasTexto}.</p>
      <div class="info-box">
        <div class="info-item">
          <span class="info-label">Disciplina:</span>
          <span class="info-value">${disciplina}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Tipo:</span>
          <span class="info-value">
            <span class="badge badge-${tipo}">${tipoFormatado}</span>
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">Data:</span>
          <span class="info-value">${dataFormatada}${
    horario ? ` às ${horario}` : ""
  }</span>
        </div>
        ${
          descricao
            ? `
        <div class="info-item">
          <span class="info-label">Descrição:</span>
          <span class="info-value">${descricao}</span>
        </div>
        `
            : ""
        }
        <div class="info-item">
          <span class="info-label">Dias restantes:</span>
          <span class="info-value"><strong>${diasRestantes}</strong> ${
    diasRestantes === 1 ? "dia" : "dias"
  }</span>
        </div>
      </div>
      <p style="margin-top: 20px;">Boa sorte nos seus estudos! 🎓</p>
      <div style="text-align: center;">
        <a href="${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/avaliacoes" class="button">
          Ver Avaliações
        </a>
      </div>
    </div>
    <div class="footer">
      <p>Esta é uma notificação automática do UFAM Hub.</p>
      <p>Você pode gerenciar suas preferências de notificação nas configurações.</p>
    </div>
  </div>
</body>
</html>
  `;
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
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e5e5;
    }
    .header h1 {
      color: #2563eb;
      margin: 0;
      font-size: 24px;
    }
    .content {
      margin-bottom: 30px;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #10b981;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-item {
      margin: 10px 0;
      display: flex;
      align-items: center;
    }
    .info-label {
      font-weight: 600;
      color: #666;
      min-width: 100px;
    }
    .info-value {
      color: #333;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e5e5e5;
      color: #666;
      font-size: 12px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #10b981;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📅 UFAM Hub</h1>
      <p>Notificação de ${tipoFormatado}</p>
    </div>
    <div class="content">
      <p>Olá!</p>
      <p>Você tem um <strong>${tipoFormatado}</strong> ${diasTexto}: <strong>${titulo}</strong></p>
      <div class="info-box">
        <div class="info-item">
          <span class="info-label">Título:</span>
          <span class="info-value">${titulo}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Data:</span>
          <span class="info-value">${dataFormatada}${
    horario ? ` às ${horario}` : ""
  }</span>
        </div>
        ${
          local
            ? `
        <div class="info-item">
          <span class="info-label">Local:</span>
          <span class="info-value">${local}</span>
        </div>
        `
            : ""
        }
        <div class="info-item">
          <span class="info-label">Dias restantes:</span>
          <span class="info-value"><strong>${diasRestantes}</strong> ${
    diasRestantes === 1 ? "dia" : "dias"
  }</span>
        </div>
      </div>
      <div style="text-align: center;">
        <a href="${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/calendar" class="button">
          Ver Calendário
        </a>
      </div>
    </div>
    <div class="footer">
      <p>Esta é uma notificação automática do UFAM Hub.</p>
      <p>Você pode gerenciar suas preferências de notificação nas configurações.</p>
    </div>
  </div>
</body>
</html>
  `;
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