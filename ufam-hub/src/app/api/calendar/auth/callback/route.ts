import { NextRequest, NextResponse } from "next/server";
import {
  createOAuth2Client,
  getTokensFromCode,
} from "@/lib/google-calendar/config";
function createErrorPage(
  title: string,
  message: string,
  errorType: string,
  errorMessage: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            color: #ffffff;
            padding: 1rem;
          }
          .container {
            text-align: center;
            padding: 3rem 2rem;
            background: #1a1a1a;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            max-width: 500px;
            width: 100%;
            border: 1px solid #2a2a2a;
            animation: fadeIn 0.3s ease-in;
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .icon-container {
            display: flex;
            justify-content: center;
            margin-bottom: 1.5rem;
          }
          .icon-circle {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
            box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
          .icon {
            width: 40px;
            height: 40px;
            stroke: #ffffff;
            stroke-width: 2;
            fill: none;
          }
          h1 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: #ffffff;
          }
          .subtitle {
            font-size: 1rem;
            color: #a0a0a0;
            margin-bottom: 2rem;
            line-height: 1.5;
          }
          .error-details {
            background: #0a0a0a;
            border: 1px solid #2a2a2a;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 2rem;
            font-size: 0.875rem;
            color: #d0d0d0;
            text-align: left;
          }
          .error-label {
            color: #808080;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.5rem;
          }
          .error-message {
            color: #ef4444;
            font-weight: 500;
          }
          .buttons {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          .btn {
            padding: 0.875rem 1.5rem;
            border-radius: 8px;
            font-size: 0.9375rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
          }
          .btn-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: #ffffff;
          }
          .btn-primary:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          }
          .btn-secondary {
            background: transparent;
            color: #a0a0a0;
            border: 1px solid #2a2a2a;
          }
          .btn-secondary:hover {
            background: #2a2a2a;
            color: #ffffff;
            border-color: #3a3a3a;
          }
          .btn-close {
            background: transparent;
            color: #808080;
            border: 1px solid #2a2a2a;
          }
          .btn-close:hover {
            background: #2a2a2a;
            color: #ffffff;
          }
          .btn-icon {
            width: 18px;
            height: 18px;
            stroke: currentColor;
            stroke-width: 2;
            fill: none;
          }
          @media (max-width: 480px) {
            .container {
              padding: 2rem 1.5rem;
            }
            h1 {
              font-size: 1.5rem;
            }
            .icon-circle {
              width: 64px;
              height: 64px;
            }
            .icon {
              width: 32px;
              height: 32px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon-container">
            <div class="icon-circle">
              <svg class="icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
          </div>
          <h1>${title}</h1>
          <p class="subtitle">${message}</p>
          <div class="error-details">
            <div class="error-label">Detalhes do erro</div>
            <div class="error-message">${errorMessage}</div>
          </div>
          <div class="buttons">
            <a href="/" class="btn btn-primary">
              <svg class="btn-icon" viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Ir para Página Inicial
            </a>
            <button onclick="window.history.back()" class="btn btn-secondary">
              <svg class="btn-icon" viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              Voltar
            </button>
            <button onclick="window.close()" class="btn btn-close">
              <svg class="btn-icon" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Fechar Janela
            </button>
          </div>
        </div>
        <script>
          // Enviar mensagem de erro para o popup pai
          if (window.opener) {
            window.opener.postMessage({
              type: "GOOGLE_CALENDAR_AUTH_ERROR",
              error: ${JSON.stringify(errorMessage)}
            }, window.location.origin);
            // Auto-fechar após 5 segundos se não houver interação
            let autoCloseTimer = setTimeout(() => {
              if (confirm("Deseja fechar esta janela?")) {
                window.close();
              }
            }, 5000);
            // Cancelar auto-fechar se o usuário interagir
            document.addEventListener('click', () => {
              clearTimeout(autoCloseTimer);
            });
          }
        </script>
      </body>
    </html>
  `;
}
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    if (error) {
      const html = createErrorPage(
        "Erro de Autenticação",
        "A autorização foi negada. Você pode tentar novamente ou voltar à página inicial.",
        "authorization_denied",
        "Autorização negada pelo usuário"
      );
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    if (!code) {
      const html = createErrorPage(
        "Erro de Autenticação",
        "O código de autorização não foi fornecido. Por favor, tente autenticar novamente.",
        "missing_code",
        "Código de autorização não fornecido"
      );
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    const oauth2Client = createOAuth2Client();
    const tokens = await getTokensFromCode(oauth2Client, code);
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Autenticação Concluída</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
              color: #ffffff;
              padding: 1rem;
            }
            .container {
              text-align: center;
              padding: 3rem 2rem;
              background: #1a1a1a;
              border-radius: 16px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
              max-width: 500px;
              width: 100%;
              border: 1px solid #2a2a2a;
              animation: fadeIn 0.3s ease-in;
            }
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(-10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .icon-container {
              display: flex;
              justify-content: center;
              margin-bottom: 1.5rem;
            }
            .icon-circle {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto;
              box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
              animation: checkmark 0.6s ease-in-out;
            }
            @keyframes checkmark {
              0% {
                transform: scale(0);
              }
              50% {
                transform: scale(1.1);
              }
              100% {
                transform: scale(1);
              }
            }
            .icon {
              width: 40px;
              height: 40px;
              stroke: #ffffff;
              stroke-width: 3;
              fill: none;
              stroke-linecap: round;
              stroke-linejoin: round;
            }
            h1 {
              font-size: 2rem;
              font-weight: 700;
              margin-bottom: 0.5rem;
              color: #ffffff;
            }
            .subtitle {
              font-size: 1rem;
              color: #a0a0a0;
              margin-bottom: 2rem;
              line-height: 1.5;
            }
            .btn {
              padding: 0.875rem 1.5rem;
              border-radius: 8px;
              font-size: 0.9375rem;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s ease;
              border: none;
              text-decoration: none;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 0.5rem;
              background: transparent;
              color: #808080;
              border: 1px solid #2a2a2a;
              width: 100%;
            }
            .btn:hover {
              background: #2a2a2a;
              color: #ffffff;
              border-color: #3a3a3a;
            }
            @media (max-width: 480px) {
              .container {
                padding: 2rem 1.5rem;
              }
              h1 {
                font-size: 1.5rem;
              }
              .icon-circle {
                width: 64px;
                height: 64px;
              }
              .icon {
                width: 32px;
                height: 32px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon-container">
              <div class="icon-circle">
                <svg class="icon" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
            <h1>Autenticação Concluída!</h1>
            <p class="subtitle">Sua conta do Google Calendar foi conectada com sucesso. Esta janela será fechada automaticamente.</p>
            <button onclick="window.close()" class="btn">
              Fechar Janela
            </button>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: "GOOGLE_CALENDAR_AUTH_SUCCESS",
                tokens: {
                  access_token: ${JSON.stringify(tokens.access_token)},
                  refresh_token: ${JSON.stringify(tokens.refresh_token || "")},
                  expiry_date: ${tokens.expiry_date || "null"}
                }
              }, window.location.origin);
              setTimeout(() => window.close(), 2000);
            } else {
              document.querySelector('.container').innerHTML =
                '<h1>Erro</h1><p class="subtitle">Esta página deve ser aberta em um popup.</p>';
            }
          </script>
        </body>
      </html>
    `;
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Erro no callback de autenticação:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    const html = createErrorPage(
      "Erro de Autenticação",
      "Ocorreu um erro durante o processo de autenticação. Por favor, tente novamente.",
      "server_error",
      `Falha na autenticação: ${errorMessage}`
    );
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}