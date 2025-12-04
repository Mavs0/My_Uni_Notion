import { NextRequest, NextResponse } from "next/server";
import {
  createOAuth2Client,
  getTokensFromCode,
} from "@/lib/google-calendar/config";
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    if (error) {
      const errorHtml = `
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Erro de Autenticação</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: #f5f5f5;
              }
              .container {
                text-align: center;
                padding: 2rem;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Erro de Autenticação</h2>
              <p>Autorização negada pelo usuário.</p>
              <p>Esta janela pode ser fechada.</p>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_CALENDAR_AUTH_ERROR',
                  error: 'Autorização negada pelo usuário'
                }, '*');
                setTimeout(() => window.close(), 2000);
              }
            </script>
          </body>
        </html>
      `;
      return new NextResponse(errorHtml, {
        headers: { "Content-Type": "text/html" },
      });
    }
    if (!code) {
      const errorHtml = `
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Erro de Autenticação</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: #f5f5f5;
              }
              .container {
                text-align: center;
                padding: 2rem;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Erro de Autenticação</h2>
              <p>Código de autorização não fornecido.</p>
              <p>Esta janela pode ser fechada.</p>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_CALENDAR_AUTH_ERROR',
                  error: 'Código de autorização não fornecido'
                }, '*');
                setTimeout(() => window.close(), 2000);
              }
            </script>
          </body>
        </html>
      `;
      return new NextResponse(errorHtml, {
        headers: { "Content-Type": "text/html" },
      });
    }
    const oauth2Client = createOAuth2Client();
    const tokens = await getTokensFromCode(oauth2Client, code);
    const successHtml = `
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Autenticação Concluída</title>
            <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .success {
              color: #10b981;
              font-size: 3rem;
              margin-bottom: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✓</div>
            <h2>Autenticação Concluída!</h2>
            <p>Você pode fechar esta janela.</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_CALENDAR_AUTH_SUCCESS',
                tokens: {
                  access_token: ${JSON.stringify(tokens.access_token)},
                  refresh_token: ${JSON.stringify(tokens.refresh_token || "")},
                  expiry_date: ${tokens.expiry_date || "null"}
                }
              }, '*');
              setTimeout(() => window.close(), 1000);
            } else {
              document.querySelector('.container').innerHTML =
                '<h2>Erro</h2><p>Esta página deve ser aberta em um popup.</p>';
            }
          </script>
        </body>
      </html>
    `;
    return new NextResponse(successHtml, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Erro no callback de autenticação:", error);
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Erro de Autenticação</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Erro de Autenticação</h2>
            <p>Falha na autenticação. Tente novamente.</p>
            <p>Esta janela pode ser fechada.</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_CALENDAR_AUTH_ERROR',
                error: 'Falha na autenticação'
              }, '*');
              setTimeout(() => window.close(), 2000);
            }
          </script>
        </body>
      </html>
    `;
    return new NextResponse(errorHtml, {
      headers: { "Content-Type": "text/html" },
    });
  }
}