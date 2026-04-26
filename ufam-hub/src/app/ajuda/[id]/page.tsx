import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, HelpCircle } from "lucide-react";
import { COLAB_WEB_LOGIN_URL } from "@/lib/external-links";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface HelpContent {
  id: string;
  title: string;
  category: string;
  content: React.ReactNode;
}

const helpContents: Record<string, HelpContent> = {
  comecando: {
    id: "comecando",
    title: "Começando no UFAM Hub",
    category: "Básico",
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Bem-vindo ao UFAM Hub!
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            O UFAM Hub é o teu espaço para disciplinas, avaliações, anotações,
            calendário e ferramentas de IA. Este guia resume o essencial para
            começares com segurança.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">1. Criar conta e entrar</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              Acede à página de{" "}
              <Link href="/login" className="text-primary hover:underline">
                login
              </Link>
            </li>
            <li>
              Usa <strong>Criar conta</strong> com <strong>e-mail e palavra-passe</strong>{" "}
              ou o link de convite que te foi enviado (
              <Link
                href="/cadastro-convidado"
                className="text-primary hover:underline"
              >
                cadastro por convite
              </Link>
              )
            </li>
            <li>Confirma o e-mail se a plataforma pedir verificação</li>
            <li>
              Opcional: em Perfil ou Segurança podes associar serviços OAuth
              (ex.: Google) quando essa opção estiver disponível na tua conta
            </li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">
            2. Completar seu Perfil
          </h3>
          <p className="text-muted-foreground mb-3">
            Após criar a conta, complete seu perfil:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Adicione uma foto de perfil</li>
            <li>Preencha seu nome completo</li>
            <li>Configure suas preferências de privacidade</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">
            3. Adicionar sua Primeira Disciplina
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              Vá para a página de{" "}
              <Link
                href="/disciplinas"
                className="text-primary hover:underline"
              >
                Disciplinas
              </Link>
            </li>
            <li>Clique em "Adicionar Disciplina"</li>
            <li>Preencha o nome da disciplina</li>
            <li>Configure tipo (obrigatória, eletiva, optativa)</li>
            <li>Adicione horários se necessário</li>
            <li>Escolha uma cor para identificação visual</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">
            4. Navegação: barra superior e menu
          </h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <strong>Barra superior:</strong> logo e nome UFAM Hub (atalho ao
              dashboard),{" "}
              <strong>busca</strong> (atalho <kbd className="rounded border bg-muted px-1 text-xs">⌘K</kbd>{" "}
              / <kbd className="rounded border bg-muted px-1 text-xs">Ctrl+K</kbd>
              ), notificações, modo foco, tema e menu da conta
            </li>
            <li>
              <strong>Menu lateral (desktop):</strong> acesso rápido a
              Disciplinas, Calendário,{" "}
              <Link href="/ajuda" className="text-primary hover:underline">
                Ajuda
              </Link>
              , Configurações, etc.
            </li>
            <li>
              <strong>Telemóvel:</strong> abre o menu com o ícone de hambúrguer
              na barra superior
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">
            5. Assistente virtual (canto do ecrã)
          </h3>
          <p className="text-muted-foreground mb-3">
            O ícone do <strong>robô</strong> no canto inferior direito abre o{" "}
            <strong>assistente rápido</strong>: respostas curtas, perguntas
            sugeridas e apoio imediato sem saíres da página.
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Fica oculto na página de Chat IA, em salas de chamada e no modo foco</li>
            <li>
              Para conversas longas, contexto por disciplina e mais ferramentas
              de IA, usa o{" "}
              <Link href="/chat" className="text-primary hover:underline">
                Chat IA
              </Link>{" "}
              (ver artigo &quot;Usando o Chat IA&quot;)
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">
            6. Explorar o Dashboard
          </h3>
          <p className="text-muted-foreground mb-3">
            O dashboard reúne widgets à tua medida: estatísticas, avaliações,
            tarefas, metas e atividade recente (conforme o que tiveres ativo).
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <strong>Resumo:</strong> visão geral do teu percurso e próximos
              passos
            </li>
            <li>
              <strong>Avaliações e tarefas:</strong> o que está para breve ou
              pendente
            </li>
            <li>
              <strong>Personalização:</strong> podes ajustar widgets nas
              definições do dashboard
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">7. Fazer o Tour Guiado</h3>
          <p className="text-muted-foreground mb-3">
            Se você é novo na plataforma, recomendamos fazer o tour guiado:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>No Dashboard, clique em "Iniciar Tour"</li>
            <li>
              Siga as instruções para conhecer as principais funcionalidades
            </li>
            <li>Complete a checklist de onboarding</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Próximos Passos</h3>
          <p className="text-muted-foreground mb-3">
            Agora que você já está configurado, explore:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <Link
                href="/ajuda/disciplinas"
                className="text-primary hover:underline"
              >
                Adicionar mais disciplinas
              </Link>
            </li>
            <li>
              <Link
                href="/ajuda/avaliacoes"
                className="text-primary hover:underline"
              >
                Registrar avaliações
              </Link>
            </li>
            <li>
              <Link
                href="/ajuda/anotacoes"
                className="text-primary hover:underline"
              >
                Criar anotações
              </Link>
            </li>
            <li>
              <Link
                href="/ajuda/chat-ia"
                className="text-primary hover:underline"
              >
                Assistente virtual e Chat IA
              </Link>
            </li>
          </ul>
        </section>
      </div>
    ),
  },
  disciplinas: {
    id: "disciplinas",
    title: "Gerenciando Disciplinas",
    category: "Básico",
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Gerenciando suas Disciplinas
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            As disciplinas são o centro da sua organização acadêmica. Aprenda a
            gerenciá-las de forma eficiente.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">
            Adicionar uma Disciplina
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              Acesse{" "}
              <Link
                href="/disciplinas"
                className="text-primary hover:underline"
              >
                Disciplinas
              </Link>
            </li>
            <li>Clique no botão "Adicionar Disciplina"</li>
            <li>
              Preencha os campos obrigatórios:
              <ul className="list-disc list-inside ml-6 mt-2">
                <li>
                  <strong>Nome:</strong> Nome completo da disciplina
                </li>
                <li>
                  <strong>Tipo:</strong> Obrigatória, Eletiva ou Optativa
                </li>
                <li>
                  <strong>Horas Semanais:</strong> Carga horária semanal
                </li>
              </ul>
            </li>
            <li>
              Campos opcionais:
              <ul className="list-disc list-inside ml-6 mt-2">
                <li>
                  <strong>Professor:</strong> Nome do professor
                </li>
                <li>
                  <strong>Local:</strong> Sala ou local da aula
                </li>
                <li>
                  <strong>Cor:</strong> Escolha uma cor para identificação
                  visual
                </li>
              </ul>
            </li>
            <li>Clique em "Salvar"</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Adicionar Horários</h3>
          <p className="text-muted-foreground mb-3">
            Para organizar melhor sua semana, adicione os horários das aulas:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Abra a página da disciplina</li>
            <li>Na seção "Horários", clique em "Adicionar Horário"</li>
            <li>Selecione o dia da semana</li>
            <li>Configure hora de início e fim</li>
            <li>Salve o horário</li>
          </ol>
          <p className="text-sm text-muted-foreground mt-3 italic">
            💡 Dica: Os horários aparecem automaticamente na sua Grade Horária!
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Editar uma Disciplina</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Abra a página da disciplina</li>
            <li>Clique no botão de edição (ícone de lápis)</li>
            <li>Modifique os campos desejados</li>
            <li>Salve as alterações</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Organizar Disciplinas</h3>
          <p className="text-muted-foreground mb-3">
            Use cores para organizar visualmente:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Cada disciplina pode ter uma cor única</li>
            <li>A cor aparece em cards, gráficos e na grade horária</li>
            <li>Use cores consistentes para facilitar identificação</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Marcar como Favorita</h3>
          <p className="text-muted-foreground mb-3">
            Marque disciplinas importantes como favoritas:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Na lista de disciplinas, clique no ícone de estrela</li>
            <li>Disciplinas favoritas aparecem primeiro na lista</li>
            <li>Use isso para priorizar disciplinas importantes</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">
            Desativar uma Disciplina
          </h3>
          <p className="text-muted-foreground mb-3">
            Se uma disciplina não está mais ativa:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Abra a página da disciplina</li>
            <li>Desative o toggle "Disciplina Ativa"</li>
            <li>A disciplina não aparecerá mais em listas principais</li>
            <li>Mas seus dados (avaliações, notas) serão preservados</li>
          </ol>
        </section>
      </div>
    ),
  },
  avaliacoes: {
    id: "avaliacoes",
    title: "Gerenciando Avaliações",
    category: "Básico",
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Gerenciando suas Avaliações
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Registre suas avaliações e acompanhe seu desempenho acadêmico de
            forma organizada.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <h3 className="text-lg font-semibold mb-2">ColabWeb (IComp)</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para entregar trabalhos e aceder a atividades no ambiente Moodle do
            Instituto de Computação, usa o{" "}
            <a
              href={COLAB_WEB_LOGIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              ColabWeb
            </a>
            . O UFAM Hub não substitui esse portal: aqui registas prazos e
            notas; a entrega oficial costuma ser no ColabWeb quando o professor
            indica &quot;plataforma&quot;.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">
            Adicionar uma Avaliação
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              Acesse{" "}
              <Link href="/avaliacoes" className="text-primary hover:underline">
                Avaliações
              </Link>{" "}
              ou a página da disciplina
            </li>
            <li>Clique em "Adicionar Avaliação"</li>
            <li>
              Preencha os campos:
              <ul className="list-disc list-inside ml-6 mt-2">
                <li>
                  <strong>Disciplina:</strong> Selecione a disciplina
                </li>
                <li>
                  <strong>Tipo:</strong> Prova, Trabalho, Apresentação, etc.
                </li>
                <li>
                  <strong>Data:</strong> Data da avaliação
                </li>
                <li>
                  <strong>Peso:</strong> Peso da avaliação (para cálculo de
                  média ponderada)
                </li>
                <li>
                  <strong>Nota:</strong> Sua nota (pode adicionar depois)
                </li>
              </ul>
            </li>
            <li>Salve a avaliação</li>
          </ol>
          <p className="text-sm text-muted-foreground mt-3 italic">
            💡 Dica: Lembretes automáticos serão criados para avaliações
            futuras!
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Cálculo de Médias</h3>
          <p className="text-muted-foreground mb-3">
            O sistema calcula automaticamente:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <strong>Média Aritmética:</strong> Soma das notas dividida pelo
              número de avaliações
            </li>
            <li>
              <strong>Média Ponderada:</strong> Considera os pesos de cada
              avaliação
            </li>
            <li>
              <strong>Média Final:</strong> Usa média ponderada se houver pesos,
              senão usa aritmética
            </li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3">
            A média é atualizada automaticamente quando você adiciona ou edita
            notas.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">
            Adicionar Nota a uma Avaliação
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Abra a página da disciplina ou a lista de avaliações</li>
            <li>Encontre a avaliação desejada</li>
            <li>Clique em "Adicionar Nota" ou edite a avaliação</li>
            <li>Digite sua nota</li>
            <li>A média será recalculada automaticamente</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">
            Visualizar Próximas Avaliações
          </h3>
          <p className="text-muted-foreground mb-3">No Dashboard, você verá:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Avaliações dos próximos 7 dias</li>
            <li>Contagem regressiva até cada avaliação</li>
            <li>Link direto para a página da disciplina</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Lembretes Automáticos</h3>
          <p className="text-muted-foreground mb-3">
            Quando você cria uma avaliação futura, lembretes são criados
            automaticamente:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <strong>3 dias antes:</strong> "Avaliação em 3 dias"
            </li>
            <li>
              <strong>1 dia antes:</strong> "Avaliação amanhã!"
            </li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3">
            Você receberá notificações push se tiver ativado as notificações.
          </p>
        </section>
      </div>
    ),
  },
  anotacoes: {
    id: "anotacoes",
    title: "Criando e Organizando Anotações",
    category: "Básico",
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Criando e Organizando Anotações
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Use o sistema de anotações para registrar tudo que você aprende. As
            anotações suportam Markdown e têm busca poderosa.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Criar uma Anotação</h3>
          <p className="text-muted-foreground mb-3">
            Atalho: em{" "}
            <Link href="/busca-anotacoes" className="text-primary hover:underline">
              Anotações
            </Link>
            , use &quot;Nova anotação&quot;, informe título e disciplina e abra o
            editor direto.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              Ou abra uma{" "}
              <Link href="/disciplinas" className="text-primary hover:underline">
                disciplina
              </Link>{" "}
              e, na seção Anotações, clique em &quot;Nova anotação&quot;
            </li>
            <li>Preencha o título</li>
            <li>Escreva seu conteúdo usando Markdown</li>
            <li>Salve a anotação</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Usar Markdown</h3>
          <p className="text-muted-foreground mb-3">
            Markdown permite formatar texto facilmente:
          </p>
          <div className="bg-muted p-4 rounded-lg text-sm font-mono space-y-1">
            <div>
              <strong>**negrito**</strong> → <strong>negrito</strong>
            </div>
            <div>
              <em>*itálico*</em> → <em>itálico</em>
            </div>
            <div># Título → Título grande</div>
            <div>- Lista → Lista com marcadores</div>
            <div>`código` → código</div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Buscar Anotações</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              Acesse{" "}
              <Link
                href="/busca-anotacoes"
                className="text-primary hover:underline"
              >
                Busca de Anotações
              </Link>
            </li>
            <li>Digite sua busca na barra de pesquisa</li>
            <li>O sistema busca em títulos e conteúdo</li>
            <li>Filtre por disciplina se necessário</li>
            <li>Clique em uma anotação para abrir</li>
          </ol>
          <p className="text-sm text-muted-foreground mt-3 italic">
            💡 Dica: Use Ctrl+K (ou Cmd+K no Mac) para busca rápida!
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Editar uma Anotação</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Abra a anotação</li>
            <li>Clique no botão de edição</li>
            <li>Modifique o conteúdo</li>
            <li>Salve as alterações</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Compartilhar Anotações</h3>
          <p className="text-muted-foreground mb-3">
            Você pode compartilhar suas anotações:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <strong>Público:</strong> Qualquer pessoa pode ver
            </li>
            <li>
              <strong>Privado:</strong> Apenas você pode ver
            </li>
            <li>
              <strong>Geral:</strong> Usuários da plataforma podem ver
            </li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3">
            Anotações compartilhadas aparecem na biblioteca compartilhada.
          </p>
        </section>
      </div>
    ),
  },
  "chat-ia": {
    id: "chat-ia",
    title: "Usando o Chat IA",
    category: "IA",
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            IA no UFAM Hub: assistente rápido e Chat completo
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Tens <strong>dois pontos de entrada</strong>: o assistente virtual
            (painel compacto no canto) para respostas rápidas, e o{" "}
            <strong>Chat IA</strong> na página dedicada para conversas mais
            longas, quizzes, mapas mentais e fluxo por disciplina.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">
            Assistente virtual (ícone do robô)
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              Clica no robô no <strong>canto inferior direito</strong> (quando
              visível)
            </li>
            <li>
              Abre-se um painel com <strong>perguntas rápidas</strong> e campo
              para escreveres — ideal para lembrar prazos, resumos curtos ou
              dúvidas pontuais
            </li>
            <li>
              O assistente <strong>não aparece</strong> na própria página{" "}
              <Link href="/chat" className="text-primary hover:underline">
                /chat
              </Link>
              , em salas de <strong>chamada</strong> nem com o{" "}
              <strong>modo foco</strong> ativo
            </li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Aceder ao Chat IA</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              Vai a{" "}
              <Link href="/chat" className="text-primary hover:underline">
                Chat IA
              </Link>{" "}
              pelo menu ou pelo atalho da barra lateral
            </li>
            <li>
              Escolhe uma <strong>disciplina</strong> quando fizer sentido —
              ajuda a IA a usar o teu contexto
            </li>
            <li>Escreve a mensagem ou cola texto / ficheiros conforme as opções da página</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Como funciona o contexto</h3>
          <p className="text-muted-foreground mb-3">
            Consoante a funcionalidade, a IA pode usar dados da tua conta de
            forma agregada, por exemplo:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Disciplinas e horários que registaste</li>
            <li>Anotações e materiais que partilhas com o chat</li>
            <li>Avaliações e metas associadas ao estudo</li>
            <li>Histórico da conversa atual (no Chat IA)</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Gerar Quizzes</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Peça para a IA gerar um quiz sobre um tópico</li>
            <li>Exemplo: "Crie um quiz sobre fotossíntese"</li>
            <li>A IA gera perguntas e respostas</li>
            <li>Responda e veja seu desempenho</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Criar Mapas Mentais</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Peça para criar um mapa mental</li>
            <li>Cole texto, envie um PDF ou digite o tema</li>
            <li>Exemplo: "Crie um mapa mental sobre o sistema nervoso"</li>
            <li>A IA gera um mapa visual interativo</li>
            <li>Você pode editar e personalizar</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Tirar Dúvidas</h3>
          <p className="text-muted-foreground mb-3">
            Faça perguntas sobre qualquer assunto:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>"Explique o conceito de X"</li>
            <li>"Qual a diferença entre Y e Z?"</li>
            <li>"Como funciona W?"</li>
            <li>"Dê exemplos de..."</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Histórico e threads</h3>
          <p className="text-muted-foreground mb-3">
            No <strong>Chat IA</strong>, as conversas costumam organizar-se por
            disciplina ou tópico, com threads que podes retomar ou arquivar
            conforme a interface mostrar.
          </p>
          <p className="text-sm text-muted-foreground">
            O painel do assistente virtual no canto é pensado para interações
            curtas; o histórico detalhado mantém-se no fluxo do Chat IA.
          </p>
        </section>
      </div>
    ),
  },
  pomodoro: {
    id: "pomodoro",
    title: "Pomodoro Timer",
    category: "Produtividade",
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Pomodoro Timer</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Use a técnica Pomodoro para manter o foco e aumentar sua
            produtividade nos estudos.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">
            O que é a Técnica Pomodoro?
          </h3>
          <p className="text-muted-foreground mb-3">
            A técnica Pomodoro consiste em:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Estudar por 25 minutos (1 Pomodoro)</li>
            <li>Fazer uma pausa de 5 minutos</li>
            <li>Repetir o ciclo</li>
            <li>A cada 4 Pomodoros, fazer uma pausa maior (15-30 minutos)</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Usar o Timer</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              Acesse{" "}
              <Link href="/pomodoro" className="text-primary hover:underline">
                Pomodoro Timer
              </Link>
            </li>
            <li>Selecione uma disciplina (opcional)</li>
            <li>Clique em "Iniciar" para começar um Pomodoro</li>
            <li>Mantenha o foco durante os 25 minutos</li>
            <li>Quando o timer acabar, faça uma pausa</li>
            <li>O ciclo continua automaticamente</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Personalizar Tempos</h3>
          <p className="text-muted-foreground mb-3">
            Você pode ajustar os tempos:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <strong>Tempo de Foco:</strong> Padrão 25 minutos (pode ajustar)
            </li>
            <li>
              <strong>Pausa Curta:</strong> Padrão 5 minutos
            </li>
            <li>
              <strong>Pausa Longa:</strong> Padrão 15 minutos (após 4 Pomodoros)
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Sons Ambiente</h3>
          <p className="text-muted-foreground mb-3">
            Escolha um som ambiente para ajudar no foco:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Chuva</li>
            <li>Floresta</li>
            <li>Café</li>
            <li>Ruído branco</li>
            <li>Nenhum (silêncio)</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Registro Automático</h3>
          <p className="text-muted-foreground mb-3">
            Quando você completa um Pomodoro:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>As horas são registradas automaticamente</li>
            <li>Você ganha XP (5 XP por Pomodoro)</li>
            <li>Seu streak é atualizado</li>
            <li>Estatísticas são atualizadas</li>
          </ul>
        </section>
      </div>
    ),
  },
  lembretes: {
    id: "lembretes",
    title: "Sistema de Lembretes",
    category: "Produtividade",
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Sistema de Lembretes Inteligentes
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Configure lembretes automáticos para nunca mais esquecer prazos
            importantes.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Lembretes Automáticos</h3>
          <p className="text-muted-foreground mb-3">
            Lembretes são criados automaticamente quando você:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <strong>Cria uma avaliação:</strong> Lembretes 3 dias e 1 dia
              antes
            </li>
            <li>
              <strong>Cria uma tarefa com prazo:</strong> Lembretes 24h, 12h e
              1h antes
            </li>
            <li>
              <strong>Mantém um streak:</strong> Lembrete quando está prestes a
              quebrar
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">
            Central de Notificações
          </h3>
          <p className="text-muted-foreground mb-3">
            Acesse pelo ícone de sino no topo da página:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Veja todas as notificações recebidas</li>
            <li>Filtre por tipo ou status (lidas/não lidas)</li>
            <li>Marque como lida individualmente ou todas de uma vez</li>
            <li>Clique para ir direto ao conteúdo relacionado</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">
            Ativar Notificações Push
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              Vá para{" "}
              <Link
                href="/configuracoes"
                className="text-primary hover:underline"
              >
                Configurações
              </Link>
            </li>
            <li>Na seção "Notificações Push", clique em "Ativar"</li>
            <li>Permita notificações quando o navegador solicitar</li>
            <li>Teste enviando uma notificação de teste</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Tipos de Lembretes</h3>
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold mb-2">📅 Avaliações</h4>
              <p className="text-sm text-muted-foreground">
                Lembretes automáticos 3 dias antes e 1 dia antes da avaliação.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">⏰ Tarefas</h4>
              <p className="text-sm text-muted-foreground">
                Alertas quando o prazo está próximo: 24h, 12h e 1h antes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🔥 Streaks</h4>
              <p className="text-sm text-muted-foreground">
                Notificação quando seu streak está prestes a quebrar.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Gerenciar Lembretes</h3>
          <p className="text-muted-foreground mb-3">Você pode:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Ver todos os lembretes agendados</li>
            <li>Deletar lembretes que não precisa mais</li>
            <li>Criar lembretes personalizados</li>
            <li>Ver histórico de notificações enviadas</li>
          </ul>
        </section>
      </div>
    ),
  },
  "feed-social": {
    id: "feed-social",
    title: "Feed Social e Interações",
    category: "Social",
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Feed Social e Interações
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Conecte-se com outros estudantes, compartilhe suas conquistas e
            descubra conteúdo interessante.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Acessar o Feed</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              Vá para{" "}
              <Link href="/feed" className="text-primary hover:underline">
                Feed
              </Link>
            </li>
            <li>
              Escolha o tipo de feed:
              <ul className="list-disc list-inside ml-6 mt-2">
                <li>
                  <strong>Personalizado:</strong> Baseado em seus interesses e
                  disciplinas
                </li>
                <li>
                  <strong>Todas:</strong> Todas as atividades públicas
                </li>
                <li>
                  <strong>Seguindo:</strong> Apenas de usuários que você segue
                </li>
                <li>
                  <strong>Públicas:</strong> Atividades públicas de todos
                </li>
              </ul>
            </li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Publicar uma Atividade</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>No Feed, clique em "Publicar"</li>
            <li>Preencha o título (obrigatório)</li>
            <li>Adicione uma descrição (opcional)</li>
            <li>Escolha a visibilidade (Público ou Privado)</li>
            <li>Clique em "Publicar"</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Reagir a Atividades</h3>
          <p className="text-muted-foreground mb-3">
            Você pode reagir de três formas:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <strong>❤️ Like:</strong> Mostre que gostou
            </li>
            <li>
              <strong>👍 Útil:</strong> Marque como útil
            </li>
            <li>
              <strong>💡 Inspirador:</strong> Marque como inspirador
            </li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3">
            Clique novamente para remover sua reação.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Comentar</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Clique no botão de comentários em uma atividade</li>
            <li>Digite seu comentário</li>
            <li>Clique em enviar</li>
            <li>Você pode deletar seus próprios comentários</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Navegação Contextual</h3>
          <p className="text-muted-foreground mb-3">
            Os cards de atividade têm links diretos:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              Clique no badge da disciplina para ir à página da disciplina
            </li>
            <li>Clique no nome do usuário para ver o perfil</li>
            <li>Links aparecem automaticamente quando aplicável</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Paginação Infinita</h3>
          <p className="text-muted-foreground mb-3">
            O feed carrega automaticamente mais conteúdo:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Role até o final da página</li>
            <li>Mais atividades são carregadas automaticamente</li>
            <li>Indicador mostra quando está carregando</li>
          </ul>
        </section>
      </div>
    ),
  },
  seguranca: {
    id: "seguranca",
    title: "Segurança da Conta",
    category: "Segurança",
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Segurança da Conta</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Proteja sua conta com as melhores práticas de segurança.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">
            Autenticação de Dois Fatores (2FA)
          </h3>
          <p className="text-muted-foreground mb-3">
            A 2FA adiciona uma camada extra de segurança:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              Vá para{" "}
              <Link
                href="/configuracoes"
                className="text-primary hover:underline"
              >
                Configurações
              </Link>
            </li>
            <li>
              Na seção "Segurança", encontre "Autenticação de Dois Fatores"
            </li>
            <li>Clique em "Configurar 2FA"</li>
            <li>
              Escaneie o QR code com seu app autenticador (Google Authenticator,
              Authy, etc.)
            </li>
            <li>Digite o código de verificação</li>
            <li>Salve os códigos de recuperação em local seguro</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Senha Forte</h3>
          <p className="text-muted-foreground mb-3">Use uma senha forte:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Mínimo de 8 caracteres</li>
            <li>Combine letras maiúsculas e minúsculas</li>
            <li>Inclua números e símbolos</li>
            <li>Não use informações pessoais</li>
            <li>Use um gerenciador de senhas</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Gerenciar Sessões</h3>
          <p className="text-muted-foreground mb-3">
            Veja e gerencie suas sessões ativas:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Em Configurações, vá para "Sessões Ativas"</li>
            <li>Veja todos os dispositivos onde você está logado</li>
            <li>Revogue sessões suspeitas</li>
            <li>
              Veja informações de cada sessão (IP, localização, último acesso)
            </li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Privacidade</h3>
          <p className="text-muted-foreground mb-3">
            Configure sua privacidade:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Escolha o que compartilhar no feed</li>
            <li>Controle visibilidade de atividades</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">OAuth e ligações de conta</h3>
          <p className="text-muted-foreground mb-3">
            O acesso principal é com <strong>e-mail e palavra-passe</strong>.
            Quando disponível na tua conta, podes associar{" "}
            <strong>Google</strong> ou <strong>GitHub</strong> em Perfil /
            Segurança (útil para integrações ou métodos adicionais definidos
            pelo administrador).
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            A ligação ao <strong>Google Calendar</strong> em Configurações é para
            calendário e eventos — não substitui por si o registo com e-mail.
          </p>
        </section>
      </div>
    ),
  },
  configuracoes: {
    id: "configuracoes",
    title: "Configurações e Personalização",
    category: "Configurações",
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Configurações e Personalização
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Personalize a plataforma conforme suas preferências.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Acessar Configurações</h3>
          <p className="text-muted-foreground mb-3">
            Vá para{" "}
            <Link
              href="/configuracoes"
              className="text-primary hover:underline"
            >
              Configurações
            </Link>{" "}
            para acessar todas as opções.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Tema e marca</h3>
          <p className="text-muted-foreground mb-3">Podes escolher:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <strong>Claro:</strong> interface com fundos claros
            </li>
            <li>
              <strong>Escuro:</strong> reduz brilho e fadiga visual à noite
            </li>
            <li>
              <strong>Sistema:</strong> segue o modo claro/escuro do
              dispositivo
            </li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3">
            O botão de tema na <strong>barra superior</strong> alterna o modo; em{" "}
            <Link href="/configuracoes" className="text-primary hover:underline">
              Configurações
            </Link>{" "}
            a preferência pode ser guardada no teu <strong>perfil</strong>{" "}
            (tema claro, escuro ou sistema).
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            A <strong>logo UFAM Hub</strong> na barra e no menu usa versões
            otimizadas para tema claro e escuro e <strong>atualiza-se
            automaticamente</strong> quando mudas de modo.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Notificações</h3>
          <p className="text-muted-foreground mb-3">Configure notificações:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <strong>Push:</strong> Notificações no navegador
            </li>
            <li>
              <strong>Email:</strong> Receba notificações por email
            </li>
            <li>Escolha quais tipos de notificações receber</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Acessibilidade</h3>
          <p className="text-muted-foreground mb-3">
            Configure recursos de acessibilidade:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <strong>Comandos de Voz:</strong> Ative comandos de voz
            </li>
            <li>
              <strong>Leitura de Tela:</strong> Suporte para leitores de tela
            </li>
            <li>
              <strong>Tamanho da Fonte:</strong> Ajuste o tamanho do texto
            </li>
            <li>
              <strong>Contraste:</strong> Aumente o contraste
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Integrações</h3>
          <p className="text-muted-foreground mb-3">
            Conecte com outros serviços:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <strong>Google Calendar:</strong> Sincronize eventos
            </li>
            <li>Configure horários de sincronização</li>
            <li>Escolha quais eventos sincronizar</li>
          </ul>
        </section>
      </div>
    ),
  },
};

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = helpContents[id];

  if (!article) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <Link href="/ajuda">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Ajuda
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold">{article.title}</h1>
              <span className="text-sm px-2 py-1 rounded-md bg-muted text-muted-foreground">
                {article.category}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <Card>
        <CardContent className="pt-6 prose prose-slate dark:prose-invert max-w-none">
          {article.content}
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Precisa de mais ajuda?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Se você ainda tem dúvidas, tente:
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/ajuda">
              <Button variant="outline" size="sm">
                Ver outros artigos
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="outline" size="sm">
                Perguntar à IA
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
