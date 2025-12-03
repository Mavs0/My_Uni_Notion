# 🎓 UFAM Hub

Sistema de gerenciamento acadêmico para estudantes da UFAM, com integração de calendário, notas, avaliações e assistente de IA.

## 🚀 Tecnologias

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Supabase** - Backend (PostgreSQL + Auth)
- **Tailwind CSS** - Estilização
- **Shadcn/ui** - Componentes UI
- **OpenAI** - Assistente de IA
- **Google Calendar API** - Integração de calendário
- **Resend** - Notificações por email

## 🔌 APIs Disponíveis

### 📚 Disciplinas

- `GET /api/disciplinas` - Listar todas as disciplinas
- `POST /api/disciplinas` - Criar nova disciplina
- `PUT /api/disciplinas` - Atualizar disciplina
- `DELETE /api/disciplinas?id=...` - Deletar disciplina
- `GET /api/disciplinas/[id]/media` - Obter mídias de uma disciplina

### 📝 Avaliações

- `GET /api/avaliacoes` - Listar todas as avaliações
- `GET /api/avaliacoes?disciplina_id=...` - Filtrar por disciplina
- `GET /api/avaliacoes?tipo=prova` - Filtrar por tipo
- `POST /api/avaliacoes` - Criar nova avaliação
- `PUT /api/avaliacoes` - Atualizar avaliação
- `DELETE /api/avaliacoes?id=...` - Deletar avaliação

### ✅ Tarefas

- `GET /api/tarefas` - Listar todas as tarefas
- `GET /api/tarefas?disciplina_id=...` - Filtrar por disciplina
- `GET /api/tarefas?concluida=true` - Filtrar por status
- `POST /api/tarefas` - Criar nova tarefa
- `PUT /api/tarefas` - Atualizar tarefa
- `DELETE /api/tarefas?id=...` - Deletar tarefa

### 📄 Anotações

- `GET /api/notas?disciplina_id=...` - Buscar anotações de uma disciplina
- `POST /api/notas` - Criar/atualizar anotação
- `GET /api/notas/search?q=...` - Buscar anotações por texto

### 🧠 Flashcards

- `GET /api/flashcards` - Listar flashcards
- `GET /api/flashcards?disciplina_id=...` - Filtrar por disciplina
- `GET /api/flashcards?para_revisar=true` - Filtrar por necessidade de revisão
- `POST /api/flashcards` - Criar flashcard
- `PUT /api/flashcards` - Atualizar flashcard
- `DELETE /api/flashcards?id=...` - Deletar flashcard
- `POST /api/flashcards/gerar` - Gerar flashcards automaticamente
- `POST /api/flashcards/revisar` - Registrar revisão de flashcard

### 🤖 Inteligência Artificial

- `POST /api/ai` - Chat completo com contexto de disciplinas (stream)
- `POST /api/ai/quick` - Resposta rápida do assistente (stream)

### 🎮 Gamificação

- `GET /api/gamificacao` - Obter dados de gamificação do usuário
- `GET /api/gamificacao?conquistas=true` - Listar conquistas desbloqueadas
- `POST /api/gamificacao` - Atualizar dados de gamificação

### 👤 Perfil

- `GET /api/profile` - Buscar perfil do usuário
- `PUT /api/profile` - Atualizar perfil

### 📊 Estatísticas

- `GET /api/estatisticas` - Obter estatísticas gerais do usuário

### 📈 Progresso

- `GET /api/progresso` - Buscar progresso
- `POST /api/progresso` - Atualizar progresso

### 👥 Colaboração

#### Compartilhamento

- `GET /api/colaboracao/compartilhar` - Listar notas compartilhadas
- `GET /api/colaboracao/compartilhar?link=...` - Buscar nota por link
- `POST /api/colaboracao/compartilhar` - Compartilhar nota
- `DELETE /api/colaboracao/compartilhar?id=...` - Deixar de compartilhar

#### Grupos de Estudo

- `GET /api/colaboracao/grupos` - Listar grupos de estudo
- `POST /api/colaboracao/grupos` - Criar grupo de estudo
- `GET /api/colaboracao/grupos/[id]/membros` - Listar membros do grupo
- `POST /api/colaboracao/grupos/[id]/membros` - Adicionar membro ao grupo
- `DELETE /api/colaboracao/grupos/[id]/membros?user_id=...` - Remover membro
- `GET /api/colaboracao/grupos/[id]/mensagens` - Listar mensagens do grupo
- `POST /api/colaboracao/grupos/[id]/mensagens` - Enviar mensagem no grupo

#### Biblioteca de Materiais

- `GET /api/colaboracao/biblioteca` - Buscar materiais na biblioteca
- `POST /api/colaboracao/biblioteca` - Adicionar material à biblioteca

#### Sugestões de Estudo

- `GET /api/colaboracao/sugestoes` - Gerar sugestões de estudo (IA)
- `POST /api/colaboracao/sugestoes` - Listar sugestões salvas
- `PUT /api/colaboracao/sugestoes` - Atualizar sugestão

### 📅 Calendário (Google Calendar)

- `GET /api/calendar/auth` - Iniciar autenticação OAuth
- `GET /api/calendar/auth/callback` - Callback de autenticação
- `GET /api/calendar/callback` - Callback alternativo
- `GET /api/calendar/events` - Listar eventos do calendário
- `GET /api/calendar/events/[eventId]` - Obter evento específico

### 📧 Notificações

#### Email

- `POST /api/notifications/email` - Enviar notificação por email
- `GET /api/email/status` - Verificar status do serviço de email
- `GET /api/email/domains` - Listar domínios configurados
- `GET /api/email/domains/[id]` - Obter informações de um domínio

#### Push Notifications

- `POST /api/notifications/push/subscribe` - Inscrever-se em notificações push
- `POST /api/notifications/push/unsubscribe` - Cancelar inscrição
- `POST /api/notifications/push/verify` - Verificar assinatura
- `POST /api/notifications/push/test` - Testar notificação push

### 🔐 Autenticação

- `POST /api/auth/send-confirmation` - Reenviar email de confirmação

## 🎣 Hooks Disponíveis

- `useDisciplinas()` - Gerenciar disciplinas
- `useAvaliacoes(filters?)` - Gerenciar avaliações
- `useGoogleCalendar()` - Integração Google Calendar
- `useEmailNotifications()` - Notificações por email
