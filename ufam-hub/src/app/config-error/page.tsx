import Link from "next/link";

/**
 * Página exibida quando NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY
 * não estão definidas (ex.: deploy no Vercel sem variáveis de ambiente).
 */
export default function ConfigErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-lg rounded-lg border border-amber-500/30 bg-amber-500/5 p-6 text-center">
        <h1 className="text-xl font-semibold text-amber-600 dark:text-amber-400 mb-2">
          Configuração necessária
        </h1>
        <p className="text-muted-foreground mb-4">
          As variáveis de ambiente do Supabase não estão definidas. Para o app
          funcionar no Vercel (ou em produção), configure-as no painel.
        </p>
        <ol className="text-left text-sm text-muted-foreground space-y-2 mb-6">
          <li>1. Acesse Vercel → seu projeto → Settings → Environment Variables</li>
          <li>2. Adicione: <code className="bg-muted px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code>, <code className="bg-muted px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> e (opcional) <code className="bg-muted px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code></li>
          <li>3. Valores em: Supabase Dashboard → Project Settings → API</li>
          <li>4. Faça um novo deploy (Redeploy) após salvar as variáveis</li>
        </ol>
        <p className="text-xs text-muted-foreground">
          Verifique também o arquivo <code className="bg-muted px-1 rounded">.env.example</code> no repositório.
        </p>
      </div>
    </div>
  );
}
