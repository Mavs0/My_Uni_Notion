export type Locale = "pt-BR" | "en";
export interface Translations {
  nav: {
    dashboard: string;
    disciplinas: string;
    avaliacoes: string;
    calendar: string;
    chat: string;
    perfil: string;
    configuracoes: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    hojeNaGrade: string;
    proximasAvaliacoes: string;
    progressoHoras: string;
    resumoDisciplinas: string;
    navegacao: string;
    acoesRapidas: string;
    verTodas: string;
    verDetalhes: string;
    novaDisciplina: string;
    novaAvaliacao: string;
    semAulasHoje: string;
    nadaPorEnquanto: string;
  };
  avaliacoes: {
    title: string;
    subtitle: string;
    novaAvaliacao: string;
    total: string;
    proximos7Dias: string;
    urgentes: string;
    todasDisciplinas: string;
    todosTipos: string;
    buscar: string;
    nenhumaEncontrada: string;
    remover: string;
    editar: string;
    confirmarRemover: string;
    confirmarRemoverDesc: string;
    cancelar: string;
    tipo: {
      prova: string;
      trabalho: string;
      seminario: string;
    };
  };
  chat: {
    title: string;
    novaConversa: string;
    limparConversa: string;
    excluirConversa: string;
    limparConversaDesc: string;
    excluirConversaDesc: string;
    semConversas: string;
    comeceConversa: string;
    perguntaAlgo: string;
    enviar: string;
    respondendo: string;
  };
  perfil: {
    title: string;
    subtitle: string;
    informacoesPessoais: string;
    informacoesConta: string;
    sobre: string;
    curso: string;
    matricula: string;
    telefone: string;
    email: string;
    membroDesde: string;
    editar: string;
    salvar: string;
    cancelar: string;
    perfilAtualizado: string;
    erroAtualizar: string;
  };
  configuracoes: {
    title: string;
    subtitle: string;
    integracoes: string;
    notificacoes: string;
    aparencia: string;
    preferenciasGerais: string;
    privacidadeDados: string;
    conectado: string;
    desconectar: string;
    conectar: string;
    notificacoesAvaliacoes: string;
    notificacoesEventos: string;
    notificacoesEmail: string;
    emailUsuario: string;
    diasAntecedencia: string;
    enviarEmailTeste: string;
    tema: string;
    idioma: string;
    formatoData: string;
    dadosArmazenados: string;
    limparDados: string;
  };
  comum: {
    salvar: string;
    cancelar: string;
    editar: string;
    remover: string;
    excluir: string;
    confirmar: string;
    fechar: string;
    hoje: string;
    amanha: string;
    dias: string;
    faltam: string;
    em: string;
    sair: string;
  };
}
export const translations: Record<Locale, Translations> = {
  "pt-BR": {
    nav: {
      dashboard: "Dashboard",
      disciplinas: "Disciplinas",
      avaliacoes: "Avaliações",
      calendar: "Calendário",
      chat: "Chat IA",
      perfil: "Perfil",
      configuracoes: "Configurações",
    },
    dashboard: {
      title: "Dashboard",
      subtitle: "Visão geral do semestre",
      hojeNaGrade: "Hoje na grade",
      proximasAvaliacoes: "Próximas avaliações",
      progressoHoras: "Progresso de horas",
      resumoDisciplinas: "Resumo das disciplinas",
      navegacao: "Navegação",
      acoesRapidas: "Ações rápidas",
      verTodas: "Ver todas",
      verDetalhes: "Ver detalhes →",
      novaDisciplina: "Nova disciplina",
      novaAvaliacao: "Nova avaliação",
      semAulasHoje: "Sem aulas hoje.",
      nadaPorEnquanto: "Nada por enquanto.",
    },
    avaliacoes: {
      title: "Avaliações",
      subtitle: "Gerencie suas provas, trabalhos e seminários",
      novaAvaliacao: "Nova Avaliação",
      total: "Total",
      proximos7Dias: "Próximos 7 dias",
      urgentes: "Urgentes (≤3 dias)",
      todasDisciplinas: "Todas as disciplinas",
      todosTipos: "Todos os tipos",
      buscar: "Buscar por disciplina ou descrição...",
      nenhumaEncontrada: "Nenhuma avaliação encontrada.",
      remover: "Remover",
      editar: "Editar",
      confirmarRemover: "Remover Avaliação",
      confirmarRemoverDesc:
        "Tem certeza que deseja remover esta avaliação? Esta ação não pode ser desfeita.",
      cancelar: "Cancelar",
      tipo: {
        prova: "Prova",
        trabalho: "Trabalho",
        seminario: "Seminário",
      },
    },
    chat: {
      title: "Chat IA",
      novaConversa: "Nova Conversa",
      limparConversa: "Limpar Conversa",
      excluirConversa: "Excluir Conversa",
      limparConversaDesc:
        "Tem certeza que deseja limpar todas as mensagens desta conversa? Esta ação não pode ser desfeita.",
      excluirConversaDesc:
        "Tem certeza que deseja excluir esta conversa? Todas as mensagens serão perdidas e esta ação não pode ser desfeita.",
      semConversas: "Nenhuma conversa ainda.",
      comeceConversa: "Comece uma conversa",
      perguntaAlgo: "Pergunte algo sobre a disciplina...",
      enviar: "Enviar",
      respondendo: "Respondendo…",
    },
    perfil: {
      title: "Meu Perfil",
      subtitle: "Gerencie suas informações pessoais",
      informacoesPessoais: "Informações Pessoais",
      informacoesConta: "Informações da Conta",
      sobre: "Sobre você",
      curso: "Curso",
      matricula: "Matrícula",
      telefone: "Telefone",
      email: "Email",
      membroDesde: "Membro desde",
      editar: "Editar",
      salvar: "Salvar Alterações",
      cancelar: "Cancelar",
      perfilAtualizado: "Perfil atualizado com sucesso!",
      erroAtualizar: "Erro ao atualizar perfil",
    },
    configuracoes: {
      title: "Configurações",
      subtitle: "Gerencie suas preferências e integrações",
      integracoes: "Integrações",
      notificacoes: "Notificações",
      aparencia: "Aparência",
      preferenciasGerais: "Preferências Gerais",
      privacidadeDados: "Privacidade e Dados",
      conectado: "Conectado e sincronizado",
      desconectar: "Desconectar",
      conectar: "Conectar",
      notificacoesAvaliacoes: "Notificações de Avaliações",
      notificacoesEventos: "Notificações de Eventos",
      notificacoesEmail: "Notificações por Email",
      emailUsuario: "Email para Notificações",
      diasAntecedencia: "Dias de Antecedência",
      enviarEmailTeste: "Enviar Email de Teste",
      tema: "Tema",
      idioma: "Idioma",
      formatoData: "Formato de Data",
      dadosArmazenados: "Dados Armazenados Localmente",
      limparDados: "Limpar Dados Locais",
    },
    comum: {
      salvar: "Salvar",
      cancelar: "Cancelar",
      editar: "Editar",
      remover: "Remover",
      excluir: "Excluir",
      confirmar: "Confirmar",
      fechar: "Fechar",
      hoje: "Hoje",
      amanha: "Amanhã",
      dias: "dias",
      faltam: "Faltam",
      em: "em",
      sair: "Sair",
    },
  },
  en: {
    nav: {
      dashboard: "Dashboard",
      disciplinas: "Subjects",
      avaliacoes: "Assessments",
      calendar: "Calendar",
      chat: "AI Chat",
      perfil: "Profile",
      configuracoes: "Settings",
    },
    dashboard: {
      title: "Dashboard",
      subtitle: "Semester overview",
      hojeNaGrade: "Today's schedule",
      proximasAvaliacoes: "Upcoming assessments",
      progressoHoras: "Hours progress",
      resumoDisciplinas: "Subjects summary",
      navegacao: "Navigation",
      acoesRapidas: "Quick actions",
      verTodas: "View all",
      verDetalhes: "View details →",
      novaDisciplina: "New subject",
      novaAvaliacao: "New assessment",
      semAulasHoje: "No classes today.",
      nadaPorEnquanto: "Nothing for now.",
    },
    avaliacoes: {
      title: "Assessments",
      subtitle: "Manage your exams, assignments and presentations",
      novaAvaliacao: "New Assessment",
      total: "Total",
      proximos7Dias: "Next 7 days",
      urgentes: "Urgent (≤3 days)",
      todasDisciplinas: "All subjects",
      todosTipos: "All types",
      buscar: "Search by subject or description...",
      nenhumaEncontrada: "No assessments found.",
      remover: "Remove",
      editar: "Edit",
      confirmarRemover: "Remove Assessment",
      confirmarRemoverDesc:
        "Are you sure you want to remove this assessment? This action cannot be undone.",
      cancelar: "Cancel",
      tipo: {
        prova: "Exam",
        trabalho: "Assignment",
        seminario: "Presentation",
      },
    },
    chat: {
      title: "AI Chat",
      novaConversa: "New Conversation",
      limparConversa: "Clear Conversation",
      excluirConversa: "Delete Conversation",
      limparConversaDesc:
        "Are you sure you want to clear all messages from this conversation? This action cannot be undone.",
      excluirConversaDesc:
        "Are you sure you want to delete this conversation? All messages will be lost and this action cannot be undone.",
      semConversas: "No conversations yet.",
      comeceConversa: "Start a conversation",
      perguntaAlgo: "Ask something about the subject...",
      enviar: "Send",
      respondendo: "Responding…",
    },
    perfil: {
      title: "My Profile",
      subtitle: "Manage your personal information",
      informacoesPessoais: "Personal Information",
      informacoesConta: "Account Information",
      sobre: "About you",
      curso: "Course",
      matricula: "Student ID",
      telefone: "Phone",
      email: "Email",
      membroDesde: "Member since",
      editar: "Edit",
      salvar: "Save Changes",
      cancelar: "Cancel",
      perfilAtualizado: "Profile updated successfully!",
      erroAtualizar: "Error updating profile",
    },
    configuracoes: {
      title: "Settings",
      subtitle: "Manage your preferences and integrations",
      integracoes: "Integrations",
      notificacoes: "Notifications",
      aparencia: "Appearance",
      preferenciasGerais: "General Preferences",
      privacidadeDados: "Privacy and Data",
      conectado: "Connected and synced",
      desconectar: "Disconnect",
      conectar: "Connect",
      notificacoesAvaliacoes: "Assessment Notifications",
      notificacoesEventos: "Event Notifications",
      notificacoesEmail: "Email Notifications",
      emailUsuario: "Email for Notifications",
      diasAntecedencia: "Days in Advance",
      enviarEmailTeste: "Send Test Email",
      tema: "Theme",
      idioma: "Language",
      formatoData: "Date Format",
      dadosArmazenados: "Locally Stored Data",
      limparDados: "Clear Local Data",
    },
    comum: {
      salvar: "Save",
      cancelar: "Cancel",
      editar: "Edit",
      remover: "Remove",
      excluir: "Delete",
      confirmar: "Confirm",
      fechar: "Close",
      hoje: "Today",
      amanha: "Tomorrow",
      dias: "days",
      faltam: "In",
      em: "in",
      sair: "Logout",
    },
  },
};