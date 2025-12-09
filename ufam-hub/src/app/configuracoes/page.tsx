"use client";
import { useState, useEffect } from "react";
import {
  Settings,
  Calendar,
  Bell,
  Moon,
  Sun,
  Globe,
  Database,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Key,
  Sparkles,
  Mail,
  Plus,
  RefreshCw,
  ExternalLink,
  Search,
  X,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { useTheme } from "next-themes";
import { useI18n } from "@/lib/i18n/context";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Check,
  Monitor,
  Accessibility,
  Keyboard,
  HelpCircle,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { AccessibilitySettingsStandalone } from "@/components/AccessibilitySettings";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
export default function ConfiguracoesPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
  const [savingTheme, setSavingTheme] = useState(false);
  useEffect(() => {
    if (previewTheme) {
      const root = document.documentElement;
      const previousTheme = root.classList.contains("dark") ? "dark" : "light";
      if (previewTheme === "dark") {
        root.classList.add("dark");
      } else if (previewTheme === "light") {
        root.classList.remove("dark");
      } else if (previewTheme === "system") {
        const systemPrefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        if (systemPrefersDark) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
      return () => {
        if (previousTheme === "dark") {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      };
    }
  }, [previewTheme]);
  const { isAuthenticated, authenticate, disconnect, isLoading } =
    useGoogleCalendar();
  const { locale, setLocale, t } = useI18n();
  const {
    isSupported: pushSupported,
    permission: pushPermission,
    subscription: pushSubscription,
    loading: pushLoading,
    subscribe: pushSubscribe,
    unsubscribe: pushUnsubscribe,
    sendTestNotification,
  } = usePushNotifications();
  const [mounted, setMounted] = useState(false);
  const [notificacoesAvaliacoes, setNotificacoesAvaliacoes] = useState(true);
  const [notificacoesEventos, setNotificacoesEventos] = useState(true);
  const [notificacoesEmail, setNotificacoesEmail] = useState(false);
  const [emailUsuario, setEmailUsuario] = useState("");
  const [diasAntecedencia, setDiasAntecedencia] = useState(1);
  const [testandoEmail, setTestandoEmail] = useState(false);
  const [modalEmail, setModalEmail] = useState<{
    open: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    open: false,
    type: "success",
    title: "",
    message: "",
  });
  const [modalLimparDados, setModalLimparDados] = useState(false);
  const [formatoData, setFormatoData] = useState("dd/MM/yyyy");
  const [geminiStatus, setGeminiStatus] = useState<"checking" | "ok" | "error">(
    "checking"
  );
  const [resendStatus, setResendStatus] = useState<"checking" | "ok" | "error">(
    "checking"
  );
  const [resendMessage, setResendMessage] = useState("");
  const [domains, setDomains] = useState<any[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [newDomainName, setNewDomainName] = useState("");
  const [addingDomain, setAddingDomain] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("geral");
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set());
  const [emailError, setEmailError] = useState("");
  const [previewNotification, setPreviewNotification] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [confirmDeleteDomain, setConfirmDeleteDomain] = useState<{
    open: boolean;
    domainId: string;
    domainName: string;
  }>({ open: false, domainId: "", domainName: "" });
  const [confirmClearData, setConfirmClearData] = useState(false);
  useEffect(() => {
    setMounted(true);
    const savedNotifAval = localStorage.getItem(
      "config:notificacoes:avaliacoes"
    );
    if (savedNotifAval !== null) {
      setNotificacoesAvaliacoes(savedNotifAval === "true");
    }
    const savedNotifEventos = localStorage.getItem(
      "config:notificacoes:eventos"
    );
    if (savedNotifEventos !== null) {
      setNotificacoesEventos(savedNotifEventos === "true");
    }
    const savedNotifEmail = localStorage.getItem("config:notificacoes:email");
    if (savedNotifEmail !== null) {
      setNotificacoesEmail(savedNotifEmail === "true");
    }
    const savedEmail = localStorage.getItem("config:email:usuario");
    if (savedEmail) {
      setEmailUsuario(savedEmail);
    }
    const savedDias = localStorage.getItem(
      "config:notificacoes:diasAntecedencia"
    );
    if (savedDias) {
      setDiasAntecedencia(Number(savedDias));
    }
    checkGeminiStatus();
    checkResendStatus();
    if (resendStatus === "ok") {
      loadDomains();
    }
  }, []);
  useEffect(() => {
    if (resendStatus === "ok") {
      loadDomains();
    }
  }, [resendStatus]);
  const checkGeminiStatus = async () => {
    setGeminiStatus("checking");
    try {
      const response = await fetch("/api/ai/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          question: "test",
        }),
      });
      if (response.ok) {
        setGeminiStatus("ok");
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Erro ao verificar Gemini:", errorData);
        setGeminiStatus("error");
      }
    } catch (error) {
      console.error("Erro ao verificar Gemini:", error);
      setGeminiStatus("error");
    }
  };
  const checkResendStatus = async () => {
    setResendStatus("checking");
    try {
      const response = await fetch("/api/email/status", {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.configured && data.status === "ok") {
          setResendStatus("ok");
          setResendMessage(data.message || "API configurada e pronta para uso");
        } else {
          setResendStatus("error");
          setResendMessage(data.message || "Chave da API não configurada");
        }
      } else {
        setResendStatus("error");
        setResendMessage("Erro ao verificar configuração");
      }
    } catch (error) {
      console.error("Erro ao verificar Resend:", error);
      setResendStatus("error");
      setResendMessage("Erro ao verificar configuração");
    }
  };
  const loadDomains = async () => {
    if (resendStatus !== "ok") return;
    setLoadingDomains(true);
    try {
      const response = await fetch("/api/email/domains", {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setDomains(data.domains || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.restricted) {
          setModalEmail({
            open: true,
            type: "error",
            title: "API Key Restrita",
            message:
              errorData.message ||
              "Sua chave da API está restrita apenas para enviar emails. Para gerenciar domínios, crie uma nova API key com permissões completas no painel do Resend.",
          });
        } else {
          console.error("Erro ao carregar domínios:", errorData);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar domínios:", error);
    } finally {
      setLoadingDomains(false);
    }
  };
  const handleAddDomain = async () => {
    if (!newDomainName.trim()) {
      setModalEmail({
        open: true,
        type: "error",
        title: "Domínio inválido",
        message: "Por favor, insira um nome de domínio válido",
      });
      return;
    }
    setAddingDomain(true);
    try {
      const response = await fetch("/api/email/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDomainName.trim() }),
      });
      const result = await response.json();
      if (response.ok) {
        setModalEmail({
          open: true,
          type: "success",
          title: "Domínio adicionado!",
          message: `Domínio ${newDomainName} adicionado com sucesso. Configure os registros DNS conforme as instruções do Resend.`,
        });
        setNewDomainName("");
        setShowDomainModal(false);
        await loadDomains();
      } else {
        setModalEmail({
          open: true,
          type: "error",
          title: result.restricted
            ? "API Key Restrita"
            : "Erro ao adicionar domínio",
          message:
            result.message ||
            result.error ||
            "Não foi possível adicionar o domínio",
        });
      }
    } catch (error) {
      console.error("Erro ao adicionar domínio:", error);
      setModalEmail({
        open: true,
        type: "error",
        title: "Erro ao adicionar domínio",
        message: "Erro de conexão. Tente novamente.",
      });
    } finally {
      setAddingDomain(false);
    }
  };
  const handleVerifyDomain = async (domainId: string) => {
    try {
      const response = await fetch(`/api/email/domains/${domainId}`, {
        method: "POST",
        credentials: "include",
      });
      const result = await response.json();
      if (response.ok) {
        setModalEmail({
          open: true,
          type: "success",
          title: "Domínio verificado!",
          message: "O domínio foi verificado com sucesso.",
        });
        await loadDomains();
      } else {
        setModalEmail({
          open: true,
          type: "error",
          title: result.restricted
            ? "API Key Restrita"
            : "Erro ao verificar domínio",
          message:
            result.message ||
            result.error ||
            "Não foi possível verificar o domínio",
        });
      }
    } catch (error) {
      console.error("Erro ao verificar domínio:", error);
      setModalEmail({
        open: true,
        type: "error",
        title: "Erro ao verificar domínio",
        message: "Erro de conexão. Tente novamente.",
      });
    }
  };
  const handleDeleteDomainClick = (domainId: string, domainName: string) => {
    setConfirmDeleteDomain({ open: true, domainId, domainName });
  };

  const handleDeleteDomain = async () => {
    const { domainId, domainName } = confirmDeleteDomain;
    setConfirmDeleteDomain({ open: false, domainId: "", domainName: "" });
    try {
      const response = await fetch(`/api/email/domains/${domainId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json();
      if (response.ok) {
        setModalEmail({
          open: true,
          type: "success",
          title: "Domínio removido!",
          message: `Domínio ${domainName} removido com sucesso.`,
        });
        await loadDomains();
      } else {
        setModalEmail({
          open: true,
          type: "error",
          title: result.restricted
            ? "API Key Restrita"
            : "Erro ao remover domínio",
          message:
            result.message ||
            result.error ||
            "Não foi possível remover o domínio",
        });
      }
    } catch (error) {
      console.error("Erro ao remover domínio:", error);
      setModalEmail({
        open: true,
        type: "error",
        title: "Erro ao remover domínio",
        message: "Erro de conexão. Tente novamente.",
      });
    }
  };
  const handleNotificacoesAvaliacoes = (checked: boolean) => {
    setNotificacoesAvaliacoes(checked);
    localStorage.setItem("config:notificacoes:avaliacoes", String(checked));
  };
  const handleNotificacoesEventos = (checked: boolean) => {
    setNotificacoesEventos(checked);
    localStorage.setItem("config:notificacoes:eventos", String(checked));
  };
  const handleNotificacoesEmail = (checked: boolean) => {
    setNotificacoesEmail(checked);
    localStorage.setItem("config:notificacoes:email", String(checked));
  };
  const validateEmail = (email: string): boolean => {
    if (!email.trim()) {
      setEmailError("");
      return true;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Email inválido. Use o formato: exemplo@email.com");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleEmailUsuarioChange = (email: string) => {
    setEmailUsuario(email);
    validateEmail(email);
    localStorage.setItem("config:email:usuario", email);
    setUnsavedChanges((prev) => {
      const next = new Set(prev);
      if (email && !emailError) next.add("email-usuario");
      else next.delete("email-usuario");
      return next;
    });
  };
  const handleDiasAntecedenciaChange = (dias: number) => {
    setDiasAntecedencia(dias);
    localStorage.setItem("config:notificacoes:diasAntecedencia", String(dias));
  };
  const handleTestarEmail = async () => {
    if (!emailUsuario || !emailUsuario.includes("@")) {
      setModalEmail({
        open: true,
        type: "error",
        title: "Email inválido",
        message: "Por favor, insira um email válido",
      });
      return;
    }
    setTestandoEmail(true);
    try {
      const response = await fetch("/api/notifications/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "avaliacao",
          data: {
            to: emailUsuario,
            disciplina: "Teste de Notificação",
            tipo: "prova",
            data: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            horario: "14:00",
            descricao:
              "Este é um email de teste do sistema de notificações do UFAM Hub.",
            diasRestantes: 1,
          },
        }),
      });
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Resposta não é JSON:", text.substring(0, 200));
        if (response.status === 401) {
          setModalEmail({
            open: true,
            type: "error",
            title: "Não autorizado",
            message: "Você precisa estar logado para enviar emails.",
          });
        } else if (response.status === 500) {
          setModalEmail({
            open: true,
            type: "error",
            title: "Erro no servidor",
            message:
              "O servidor encontrou um problema. Verifique se a chave da API de email está configurada corretamente.",
          });
        } else {
          setModalEmail({
            open: true,
            type: "error",
            title: "Erro de conexão",
            message:
              "Não foi possível enviar o email. Verifique sua conexão e tente novamente.",
          });
        }
        return;
      }
      const result = await response.json();
      if (response.ok) {
        setModalEmail({
          open: true,
          type: "success",
          title: "Email enviado!",
          message:
            "Email de teste enviado com sucesso! Verifique sua caixa de entrada.",
        });
      } else {
        const errorMessage =
          result.error || "Erro desconhecido ao enviar email";
        setModalEmail({
          open: true,
          type: "error",
          title: "Erro ao enviar email",
          message: errorMessage,
        });
      }
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      if (errorMessage.includes("JSON") || errorMessage.includes("DOCTYPE")) {
        setModalEmail({
          open: true,
          type: "error",
          title: "Erro de resposta",
          message:
            "O servidor retornou uma resposta inválida. Verifique se a API de email está configurada corretamente.",
        });
      } else if (errorMessage.includes("fetch")) {
        setModalEmail({
          open: true,
          type: "error",
          title: "Erro de conexão",
          message:
            "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.",
        });
      } else {
        setModalEmail({
          open: true,
          type: "error",
          title: "Erro ao enviar email",
          message: errorMessage,
        });
      }
    } finally {
      setTestandoEmail(false);
    }
  };
  const handleLimparDadosLocais = () => {
    setConfirmClearData(true);
  };
  const confirmarLimparDados = () => {
    setConfirmClearData(false);
    const keysToKeep = ["google_calendar_tokens"];
    const allKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) allKeys.push(key);
    }
    allKeys.forEach((key) => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    setModalLimparDados(false);
    setModalEmail({
      open: true,
      type: "success",
      title: "Dados limpos!",
      message: "Dados locais limpos com sucesso! A página será recarregada.",
    });
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const getIntegrationsStatusCount = () => {
    let count = 0;
    if (!isAuthenticated) count++;
    if (geminiStatus === "error") count++;
    if (resendStatus === "error") count++;
    return count;
  };

  const getNotificationsStatusCount = () => {
    let count = 0;
    if (
      !notificacoesAvaliacoes &&
      !notificacoesEventos &&
      !notificacoesEmail &&
      !pushSubscription
    ) {
      count = 1;
    }
    return count;
  };

  const shouldShowCard = (cardTitle: string, cardDescription: string) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      cardTitle.toLowerCase().includes(query) ||
      cardDescription.toLowerCase().includes(query)
    );
  };

  const shouldShowSetting = (title: string, description: string) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      title.toLowerCase().includes(query) ||
      description.toLowerCase().includes(query)
    );
  };

  if (!mounted) {
    return null;
  }
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 pb-12">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold flex items-center gap-3 bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
          <Settings className="h-9 w-9 text-zinc-900 dark:text-zinc-100" />
          {t.configuracoes.title}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg">
          {t.configuracoes.subtitle}
        </p>
      </header>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar configurações..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9 h-10 w-full"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {unsavedChanges.size > 0 && (
        <div className="flex items-center justify-end">
          <Badge variant="warning" className="animate-pulse">
            {unsavedChanges.size}{" "}
            {unsavedChanges.size === 1
              ? "alteração não salva"
              : "alterações não salvas"}
          </Badge>
        </div>
      )}
      {}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto sm:h-12 bg-muted/50 gap-1 p-1">
          <TabsTrigger
            value="geral"
            className="flex items-center gap-2 relative text-xs sm:text-sm"
          >
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger
            value="integracoes"
            className="flex items-center gap-2 relative text-xs sm:text-sm"
          >
            <Key className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Integrações</span>
            {getIntegrationsStatusCount() > 0 && (
              <Badge
                variant="error"
                className="ml-1 h-4 min-w-4 px-1 text-[9px] sm:h-5 sm:min-w-5 sm:px-1.5 sm:text-[10px]"
              >
                {getIntegrationsStatusCount()}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="notificacoes"
            className="flex items-center gap-2 relative text-xs sm:text-sm"
          >
            <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Notificações</span>
            {getNotificationsStatusCount() > 0 && (
              <Badge
                variant="warning"
                className="ml-1 h-4 min-w-4 px-1 text-[9px] sm:h-5 sm:min-w-5 sm:px-1.5 sm:text-[10px]"
              >
                {getNotificationsStatusCount()}
              </Badge>
            )}
            {unsavedChanges.has("notificacoes-avaliacoes") ||
            unsavedChanges.has("notificacoes-eventos") ||
            unsavedChanges.has("notificacoes-email") ||
            unsavedChanges.has("email-usuario") ||
            unsavedChanges.has("dias-antecedencia") ? (
              <Badge
                variant="warning"
                className="ml-1 h-3 px-1 text-[9px] sm:h-4 sm:text-[10px]"
              >
                !
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger
            value="aparencia"
            className="flex items-center gap-2 relative text-xs sm:text-sm"
          >
            <Sun className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Aparência</span>
            {previewTheme && (
              <Badge
                variant="warning"
                className="ml-1 h-3 px-1 text-[9px] sm:h-4 sm:text-[10px]"
              >
                !
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="acessibilidade"
            className="flex items-center gap-2 relative text-xs sm:text-sm"
          >
            <Accessibility className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Acessibilidade</span>
          </TabsTrigger>
          <TabsTrigger
            value="atalhos"
            className="flex items-center gap-2 relative text-xs sm:text-sm"
          >
            <Keyboard className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Atalhos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6 mt-6">
          {shouldShowCard(
            t.configuracoes.preferenciasGerais,
            locale === "pt-BR"
              ? "Configurações de idioma e formato"
              : "Language and format settings"
          ) && (
            <Card className="border-2 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-indigo-500/10">
                    <Globe className="h-5 w-5 text-indigo-500" />
                  </div>
                  {t.configuracoes.preferenciasGerais}
                </CardTitle>
                <CardDescription className="text-base">
                  {locale === "pt-BR"
                    ? "Configurações de idioma e formato"
                    : "Language and format settings"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {shouldShowSetting(
                  t.configuracoes.idioma,
                  locale === "pt-BR"
                    ? "Idioma da interface"
                    : "Interface language"
                ) && (
                  <div className="flex items-center justify-between p-4 rounded-xl border-2 transition-all hover:shadow-md bg-gradient-to-r from-white to-indigo-50/30 dark:from-zinc-900 dark:to-indigo-950/10">
                    <div>
                      <div className="font-semibold text-base">
                        {t.configuracoes.idioma}
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        {locale === "pt-BR"
                          ? "Idioma da interface"
                          : "Interface language"}
                      </div>
                    </div>
                    <select
                      value={locale}
                      onChange={(e) =>
                        setLocale(e.target.value as "pt-BR" | "en")
                      }
                      className="rounded-lg border-2 bg-background px-4 py-2 text-sm font-medium hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                    >
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                )}
                {shouldShowSetting(
                  t.configuracoes.formatoData,
                  locale === "pt-BR"
                    ? "Como as datas são exibidas"
                    : "How dates are displayed"
                ) && (
                  <TooltipProvider>
                    <div className="flex items-center justify-between p-4 rounded-xl border-2 transition-all hover:shadow-md bg-gradient-to-r from-white to-indigo-50/30 dark:from-zinc-900 dark:to-indigo-950/10">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-semibold text-base">
                            {t.configuracoes.formatoData}
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p>
                                Define como as datas serão exibidas em toda a
                                plataforma (avaliações, eventos, etc.).
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                          {locale === "pt-BR"
                            ? "Como as datas são exibidas"
                            : "How dates are displayed"}
                        </div>
                      </div>
                      <select
                        value={formatoData}
                        onChange={(e) => setFormatoData(e.target.value)}
                        className="rounded-lg border-2 bg-background px-4 py-2 text-sm font-medium hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                      >
                        <option value="dd/MM/yyyy">DD/MM/AAAA</option>
                        <option value="MM/dd/yyyy">MM/DD/AAAA</option>
                        <option value="yyyy-MM-dd">AAAA-MM-DD</option>
                      </select>
                    </div>
                  </TooltipProvider>
                )}
              </CardContent>
            </Card>
          )}
          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Database className="h-5 w-5 text-red-500" />
                </div>
                Privacidade e Dados
              </CardTitle>
              <CardDescription className="text-base">
                Gerencie seus dados e privacidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-5 rounded-xl border-2 bg-yellow-500/10 border-yellow-500/30 dark:bg-yellow-500/5 dark:border-yellow-500/20">
                <div className="font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                  Dados Armazenados Localmente
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Os seguintes dados são armazenados no seu navegador:
                </div>
                <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Avaliações e disciplinas</li>
                  <li>Progresso de horas assistidas</li>
                  <li>Configurações de notificações</li>
                  <li>Tokens de autenticação (Google Calendar)</li>
                </ul>
              </div>
              <div className="flex items-center justify-between p-5 rounded-xl border-2 border-red-500/30 bg-red-500/10 dark:bg-red-500/5 dark:border-red-500/20 transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-base text-red-600 dark:text-red-400">
                      Limpar Dados Locais
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      Remove todos os dados armazenados localmente (exceto
                      autenticações)
                    </div>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLimparDadosLocais}
                  className="shadow-md hover:shadow-lg transition-shadow"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integracoes" className="space-y-6 mt-6">
          {shouldShowCard(
            t.configuracoes.integracoes,
            locale === "pt-BR"
              ? "Conecte e gerencie serviços externos"
              : "Connect and manage external services"
          ) && (
            <Card className="border-2 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Key className="h-5 w-5 text-blue-500" />
                  </div>
                  {t.configuracoes.integracoes}
                </CardTitle>
                <CardDescription className="text-base">
                  {locale === "pt-BR"
                    ? "Conecte e gerencie serviços externos"
                    : "Connect and manage external services"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {}
                <div className="flex items-center justify-between p-4 rounded-xl border-2 bg-gradient-to-r from-white to-blue-50/50 dark:from-zinc-900 dark:to-blue-950/20 transition-all hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <Calendar className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-base">
                        Google Calendar
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2 mt-1">
                        {isAuthenticated ? (
                          <>
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                            Conectado e sincronizado
                          </>
                        ) : (
                          <>
                            <span className="h-2 w-2 rounded-full bg-zinc-400"></span>
                            Não conectado
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAuthenticated ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={disconnect}
                          disabled={isLoading}
                          className="border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          Desconectar
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={authenticate}
                        disabled={isLoading}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Calendar className="h-4 w-4" />
                        )}
                        Conectar
                      </Button>
                    )}
                  </div>
                </div>
                {}
                <div className="flex items-center justify-between p-4 rounded-xl border-2 bg-gradient-to-r from-white to-purple-50/50 dark:from-zinc-900 dark:to-purple-950/20 transition-all hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-purple-500/10">
                      <Sparkles className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-base">
                        Google Gemini API
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2 mt-1">
                        {geminiStatus === "checking" ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Verificando...
                          </>
                        ) : geminiStatus === "ok" ? (
                          <>
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                            Configurada e funcionando
                          </>
                        ) : (
                          <>
                            <span className="h-2 w-2 rounded-full bg-red-500"></span>
                            Não configurada ou com erro
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {geminiStatus === "checking" ? (
                      <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                    ) : geminiStatus === "ok" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={checkGeminiStatus}
                      className="hover:bg-purple-50 dark:hover:bg-purple-950/20"
                    >
                      Verificar
                    </Button>
                  </div>
                </div>
                {}
                <div className="flex items-center justify-between p-4 rounded-xl border-2 bg-gradient-to-r from-white to-emerald-50/50 dark:from-zinc-900 dark:to-emerald-950/20 transition-all hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-emerald-500/10">
                      <Bell className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-base">
                        Resend Email API
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2 mt-1">
                        {resendStatus === "checking" ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Verificando...
                          </>
                        ) : resendStatus === "ok" ? (
                          <>
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                            {resendMessage || "Configurada e funcionando"}
                          </>
                        ) : (
                          <>
                            <span className="h-2 w-2 rounded-full bg-red-500"></span>
                            {resendMessage || "Não configurada"}
                          </>
                        )}
                      </div>
                      {resendStatus === "error" && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 p-2 rounded bg-zinc-100 dark:bg-zinc-800">
                          Adicione{" "}
                          <code className="bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-xs font-mono">
                            RESEND_API_KEY
                          </code>{" "}
                          no arquivo{" "}
                          <code className="bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-xs font-mono">
                            .env.local
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {resendStatus === "checking" ? (
                      <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                    ) : resendStatus === "ok" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={checkResendStatus}
                      className="hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                    >
                      Verificar
                    </Button>
                  </div>
                </div>
                {}
                {resendStatus === "ok" && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Domínios Verificados
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          Gerencie os domínios configurados no Resend
                          <br />
                          <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                            ⚠️ Requer API key com permissões completas
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadDomains}
                          disabled={loadingDomains}
                        >
                          {loadingDomains ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setShowDomainModal(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Domínio
                        </Button>
                      </div>
                    </div>
                    {loadingDomains ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                      </div>
                    ) : domains.length === 0 ? (
                      <div className="text-center py-12 text-sm">
                        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 w-fit mx-auto mb-4">
                          <Mail className="h-8 w-8 text-zinc-400" />
                        </div>
                        <p className="font-medium text-zinc-700 dark:text-zinc-300">
                          Nenhum domínio configurado
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          Adicione um domínio para enviar emails personalizados
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {domains.map((domain: any) => (
                          <div
                            key={domain.id}
                            className="flex items-center justify-between p-4 rounded-xl border-2 bg-gradient-to-r from-white to-emerald-50/30 dark:from-zinc-900 dark:to-emerald-950/10 transition-all hover:shadow-md"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {domain.name}
                              </div>
                              <div className="text-xs text-zinc-500 mt-1">
                                Status:{" "}
                                <span
                                  className={
                                    domain.status === "verified"
                                      ? "text-green-500"
                                      : domain.status === "pending"
                                      ? "text-yellow-500"
                                      : "text-red-500"
                                  }
                                >
                                  {domain.status === "verified"
                                    ? "Verificado"
                                    : domain.status === "pending"
                                    ? "Pendente"
                                    : "Erro"}
                                </span>
                                {domain.region && (
                                  <> • Região: {domain.region}</>
                                )}
                              </div>
                              {domain.records && domain.records.length > 0 && (
                                <div className="text-xs text-zinc-400 mt-1">
                                  {domain.records.length} registro(s) DNS
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {domain.status !== "verified" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVerifyDomain(domain.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Verificar
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteDomainClick(
                                    domain.id,
                                    domain.name
                                  )
                                }
                                className="text-red-400 hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-6 mt-6">
          {shouldShowCard(
            "Notificações",
            "Configure quando e como você deseja ser notificado"
          ) && (
            <Card className="border-2 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Bell className="h-5 w-5 text-orange-500" />
                  </div>
                  Notificações
                </CardTitle>
                <CardDescription className="text-base">
                  Configure quando e como você deseja ser notificado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl border-2 transition-all hover:shadow-md bg-gradient-to-r from-white to-orange-50/30 dark:from-zinc-900 dark:to-orange-950/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <CheckCircle className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-base">
                        Notificações de Avaliações
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        Receba alertas sobre provas e trabalhos próximos
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={notificacoesAvaliacoes}
                    onCheckedChange={handleNotificacoesAvaliacoes}
                  />
                </div>
                <TooltipProvider>
                  <div className="flex items-center justify-between p-4 rounded-xl border-2 transition-all hover:shadow-md bg-gradient-to-r from-white to-orange-50/30 dark:from-zinc-900 dark:to-orange-950/10">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <Calendar className="h-5 w-5 text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-base">
                            Notificações de Eventos
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p>
                                Receba notificações sobre eventos sincronizados
                                do Google Calendar e eventos criados na
                                plataforma.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                          Alertas sobre eventos do calendário
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={notificacoesEventos}
                      onCheckedChange={handleNotificacoesEventos}
                    />
                  </div>
                </TooltipProvider>
                <Separator className="my-4" />
                {}
                <div className="space-y-4 p-5 rounded-xl border-2 bg-gradient-to-br from-blue-50 via-blue-50/50 to-white dark:from-blue-950/30 dark:via-blue-950/20 dark:to-zinc-900 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Notificações por Email</div>
                      <div className="text-sm text-zinc-500">
                        Receba notificações importantes por email
                      </div>
                    </div>
                    <Switch
                      checked={notificacoesEmail}
                      onCheckedChange={handleNotificacoesEmail}
                    />
                  </div>
                  {notificacoesEmail && (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <label className="text-sm font-semibold mb-2 block text-zinc-700 dark:text-zinc-300">
                          Email para Notificações
                        </label>
                        <div className="space-y-1">
                          <Input
                            type="email"
                            placeholder="seu@email.com"
                            value={emailUsuario}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => handleEmailUsuarioChange(e.target.value)}
                            className={`w-full border-2 transition-colors ${
                              emailError
                                ? "border-red-500 focus:border-red-500"
                                : "focus:border-blue-400 dark:focus:border-blue-600"
                            }`}
                          />
                          {emailError && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {emailError}
                            </p>
                          )}
                          {!emailError && (
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                              Email onde você receberá as notificações
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-semibold mb-2 block text-zinc-700 dark:text-zinc-300">
                          Dias de Antecedência
                        </label>
                        <div className="flex items-center gap-3">
                          <Input
                            type="number"
                            min="0"
                            max="7"
                            value={diasAntecedencia}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) =>
                              handleDiasAntecedenciaChange(
                                Number(e.target.value)
                              )
                            }
                            className="w-24 border-2 focus:border-blue-400 dark:focus:border-blue-600 transition-colors font-medium text-center"
                          />
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {diasAntecedencia === 0
                              ? "No mesmo dia"
                              : diasAntecedencia === 1
                              ? "1 dia antes"
                              : `${diasAntecedencia} dias antes`}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
                          Quantos dias antes você deseja ser notificado
                        </p>
                      </div>
                      <div className="pt-2 space-y-3">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewNotification(true)}
                            className="flex-1 border-2 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleTestarEmail}
                            disabled={
                              testandoEmail || !emailUsuario || !!emailError
                            }
                            className="flex-1 border-2 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all font-medium"
                          >
                            {testandoEmail ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Bell className="h-4 w-4 mr-2" />
                                Enviar Teste
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 text-center">
                          Visualize como será a notificação antes de enviar
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <Separator className="my-4" />
                {}
                <div className="space-y-4 p-5 rounded-xl border-2 bg-gradient-to-br from-purple-50 via-purple-50/50 to-white dark:from-purple-950/30 dark:via-purple-950/20 dark:to-zinc-900 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Notificações Push
                      </div>
                      <div className="text-sm text-zinc-500">
                        Receba notificações no navegador mesmo com o app fechado
                      </div>
                    </div>
                    {!pushLoading && (
                      <Switch
                        checked={!!pushSubscription}
                        onCheckedChange={async (checked) => {
                          if (checked) {
                            await pushSubscribe();
                          } else {
                            await pushUnsubscribe();
                          }
                        }}
                        disabled={!pushSupported}
                      />
                    )}
                  </div>
                  {pushLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                      <span className="ml-2 text-sm text-zinc-500">
                        Verificando...
                      </span>
                    </div>
                  ) : !pushSupported ? (
                    <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium text-yellow-800 dark:text-yellow-400 mb-1">
                            Notificações push não suportadas
                          </div>
                          <div className="text-yellow-700 dark:text-yellow-500">
                            Seu navegador não suporta notificações push. Use
                            Chrome, Firefox, Edge ou Safari (versões recentes).
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : pushPermission === "denied" ? (
                    <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10">
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium text-red-800 dark:text-red-400 mb-1">
                            Permissão negada
                          </div>
                          <div className="text-red-700 dark:text-red-500">
                            As notificações foram bloqueadas. Para ativar,
                            acesse as configurações do navegador e permita
                            notificações para este site.
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : pushSubscription ? (
                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <div className="flex-1">
                          <div className="font-medium text-green-800 dark:text-green-400">
                            Notificações push ativadas
                          </div>
                          <div className="text-xs text-green-700 dark:text-green-500">
                            Você receberá notificações sobre avaliações e
                            tarefas próximas
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={sendTestNotification}
                        className="w-full border-2 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-700 transition-all font-medium"
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Enviar Notificação de Teste
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-4 border-t">
                      <div className="p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
                        <div className="text-sm text-zinc-700 dark:text-zinc-300">
                          Ative as notificações push para receber alertas sobre:
                        </div>
                        <ul className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400 list-disc list-inside">
                          <li>
                            Avaliações próximas (provas, trabalhos, seminários)
                          </li>
                          <li>Tarefas com prazo próximo</li>
                          <li>Eventos do calendário</li>
                        </ul>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const success = await pushSubscribe();
                          if (success) {
                          }
                        }}
                        className="w-full border-2 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-700 transition-all font-medium"
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Ativar Notificações Push
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="aparencia" className="space-y-6 mt-6">
          {shouldShowCard(
            t.configuracoes.aparencia,
            locale === "pt-BR"
              ? "Personalize a aparência da aplicação"
              : "Customize the application appearance"
          ) && (
            <Card className="border-2 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    {theme === "dark" ? (
                      <Moon className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <Sun className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                  {t.configuracoes.aparencia}
                </CardTitle>
                <CardDescription className="text-base">
                  {locale === "pt-BR"
                    ? "Personalize a aparência da aplicação"
                    : "Customize the application appearance"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <div className="font-medium mb-1">
                      {t.configuracoes.tema}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {locale === "pt-BR"
                        ? "Escolha entre tema claro, escuro ou seguir a preferência do sistema"
                        : "Choose between light, dark theme or follow system preference"}
                    </div>
                  </div>
                  {}
                  {previewTheme && (
                    <div className="p-4 rounded-lg border-2 border-primary/50 bg-muted/30 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          Preview do tema
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {locale === "pt-BR"
                          ? "Clique em 'Aplicar' para confirmar ou 'Cancelar' para voltar"
                          : "Click 'Apply' to confirm or 'Cancel' to go back"}
                      </div>
                    </div>
                  )}
                  {}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        setPreviewTheme("light");
                      }}
                      className={`relative p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                        previewTheme === "light"
                          ? "border-primary bg-primary/5"
                          : previewTheme === null && theme === "light"
                          ? "border-primary/50 bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div
                        className={`w-full h-20 rounded mb-3 transition-colors ${
                          previewTheme === "light" ||
                          (previewTheme === null && theme === "light")
                            ? "bg-white border-2 border-gray-200"
                            : "bg-gray-100"
                        }`}
                      >
                        <div className="p-3 space-y-2">
                          <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                          <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-8 bg-gray-300 rounded"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4 text-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            Claro
                          </span>
                        </div>
                        {(previewTheme === "light" ||
                          (previewTheme === null && theme === "light")) && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setPreviewTheme("dark");
                      }}
                      className={`relative p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                        previewTheme === "dark"
                          ? "border-primary bg-primary/5"
                          : previewTheme === null && theme === "dark"
                          ? "border-primary/50 bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div
                        className={`w-full h-20 rounded mb-3 transition-colors ${
                          previewTheme === "dark" ||
                          (previewTheme === null && theme === "dark")
                            ? "bg-zinc-900 border-2 border-zinc-700"
                            : "bg-zinc-800"
                        }`}
                      >
                        <div className="p-3 space-y-2">
                          <div className="h-2 bg-zinc-700 rounded w-3/4"></div>
                          <div className="h-2 bg-zinc-800 rounded w-1/2"></div>
                          <div className="h-8 bg-zinc-700 rounded"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4 text-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            Escuro
                          </span>
                        </div>
                        {(previewTheme === "dark" ||
                          (previewTheme === null && theme === "dark")) && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setPreviewTheme("system");
                      }}
                      className={`relative p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                        previewTheme === "system"
                          ? "border-primary bg-primary/5"
                          : previewTheme === null && theme === "system"
                          ? "border-primary/50 bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="w-full h-20 rounded mb-3 overflow-hidden relative bg-gradient-to-br from-white via-gray-100 to-zinc-900 border-2 border-gray-300">
                        <div className="absolute inset-0 flex">
                          <div className="w-1/2 p-2 space-y-1.5">
                            <div className="h-1.5 bg-gray-300 rounded w-3/4"></div>
                            <div className="h-1.5 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-6 bg-gray-300 rounded"></div>
                          </div>
                          <div className="w-1/2 p-2 space-y-1.5 bg-zinc-900">
                            <div className="h-1.5 bg-zinc-700 rounded w-3/4"></div>
                            <div className="h-1.5 bg-zinc-800 rounded w-1/2"></div>
                            <div className="h-6 bg-zinc-700 rounded"></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            Sistema
                          </span>
                        </div>
                        {(previewTheme === "system" ||
                          (previewTheme === null && theme === "system")) && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </button>
                  </div>
                  {}
                  {previewTheme && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewTheme(null)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={async () => {
                          setSavingTheme(true);
                          try {
                            setTheme(previewTheme);
                            const response = await fetch("/api/profile", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                tema_preferencia: previewTheme,
                              }),
                            });
                            if (!response.ok) {
                              throw new Error("Erro ao salvar preferência");
                            }
                            setPreviewTheme(null);
                            toast.success(
                              locale === "pt-BR"
                                ? "Tema atualizado com sucesso!"
                                : "Theme updated successfully!"
                            );
                          } catch (error) {
                            console.error("Erro ao salvar tema:", error);
                            toast.error(
                              locale === "pt-BR"
                                ? "Erro ao salvar preferência de tema"
                                : "Error saving theme preference"
                            );
                          } finally {
                            setSavingTheme(false);
                          }
                        }}
                        disabled={savingTheme}
                        className="flex-1"
                      >
                        {savingTheme ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {locale === "pt-BR" ? "Salvando..." : "Saving..."}
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            {locale === "pt-BR" ? "Aplicar" : "Apply"}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  {}
                  {!previewTheme && (
                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        {locale === "pt-BR"
                          ? "Tema atual: "
                          : "Current theme: "}
                        <span className="font-medium text-foreground">
                          {theme === "system"
                            ? locale === "pt-BR"
                              ? "Sistema"
                              : "System"
                            : theme === "dark"
                            ? locale === "pt-BR"
                              ? "Escuro"
                              : "Dark"
                            : locale === "pt-BR"
                            ? "Claro"
                            : "Light"}
                          {theme === "system" &&
                            ` (${
                              resolvedTheme === "dark"
                                ? locale === "pt-BR"
                                  ? "Escuro"
                                  : "Dark"
                                : locale === "pt-BR"
                                ? "Claro"
                                : "Light"
                            })`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="acessibilidade" className="space-y-6 mt-6">
          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Accessibility className="h-5 w-5 text-purple-500" />
                </div>
                Acessibilidade
              </CardTitle>
              <CardDescription className="text-base">
                Personalize a experiência de acordo com suas necessidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccessibilitySettingsStandalone />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="atalhos" className="space-y-6 mt-6">
          {shouldShowCard(
            "Atalhos de Teclado",
            "Visualize e personalize os atalhos de teclado disponíveis"
          ) && (
            <Card className="border-2 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Keyboard className="h-5 w-5 text-purple-500" />
                  </div>
                  Atalhos de Teclado
                </CardTitle>
                <CardDescription className="text-base">
                  Visualize e personalize os atalhos de teclado disponíveis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Navegação
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                        <div>
                          <div className="font-medium text-sm">Buscar</div>
                          <div className="text-xs text-muted-foreground">
                            Abrir busca rápida
                          </div>
                        </div>
                        <kbd className="px-2.5 py-1.5 rounded border bg-background font-mono text-xs">
                          ⌘K
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                        <div>
                          <div className="font-medium text-sm">
                            Pular para conteúdo
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Navegação por teclado
                          </div>
                        </div>
                        <kbd className="px-2.5 py-1.5 rounded border bg-background font-mono text-xs">
                          Tab
                        </kbd>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Configurações
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                        <div>
                          <div className="font-medium text-sm">
                            Fechar diálogo
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Fechar qualquer diálogo aberto
                          </div>
                        </div>
                        <kbd className="px-2.5 py-1.5 rounded border bg-background font-mono text-xs">
                          Esc
                        </kbd>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      * Personalização de atalhos em breve
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      {}
      <Dialog
        open={modalEmail.open}
        onOpenChange={(open) => setModalEmail((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modalEmail.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              {modalEmail.title}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {modalEmail.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() =>
                setModalEmail((prev) => ({ ...prev, open: false }))
              }
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {}
      <Dialog open={modalLimparDados} onOpenChange={setModalLimparDados}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Limpar Dados Locais
            </DialogTitle>
            <DialogDescription className="pt-2">
              Tem certeza que deseja limpar todos os dados locais? Esta ação não
              pode ser desfeita.
              <br />
              <span className="text-sm text-zinc-500 mt-2 block">
                Tokens de autenticação serão mantidos.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalLimparDados(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarLimparDados}>
              Limpar Dados
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {}
      <Dialog open={showDomainModal} onOpenChange={setShowDomainModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Novo Domínio
            </DialogTitle>
            <DialogDescription className="pt-2">
              Adicione um domínio para enviar emails personalizados. Após
              adicionar, você precisará configurar os registros DNS conforme as
              instruções do Resend.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Nome do Domínio
              </label>
              <Input
                type="text"
                placeholder="exemplo.com"
                value={newDomainName}
                onChange={(e) => setNewDomainName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !addingDomain) {
                    handleAddDomain();
                  }
                }}
              />
              <p className="text-xs text-zinc-500 mt-1">
                Digite apenas o domínio (sem http:
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Nota:</strong> Após adicionar o domínio, você receberá
                instruções para configurar os registros DNS (SPF, DKIM, etc.) no
                painel do Resend.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDomainModal(false);
                setNewDomainName("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddDomain}
              disabled={addingDomain || !newDomainName.trim()}
            >
              {addingDomain ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Domínio
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewNotification} onOpenChange={setPreviewNotification}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview de Notificação
            </DialogTitle>
            <DialogDescription>
              Visualize como será a notificação enviada por email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-zinc-900">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Bell className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-base mb-1">
                    Avaliação Próxima:{" "}
                    {locale === "pt-BR" ? "Prova de Matemática" : "Math Test"}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    {diasAntecedencia === 0
                      ? "Hoje"
                      : diasAntecedencia === 1
                      ? "Amanhã"
                      : `Em ${diasAntecedencia} dias`}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Você será notificado{" "}
                    {diasAntecedencia === 0
                      ? "no mesmo dia"
                      : diasAntecedencia === 1
                      ? "1 dia antes"
                      : `${diasAntecedencia} dias antes`}{" "}
                    da avaliação.
                  </div>
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              <strong>Email destinatário:</strong>{" "}
              {emailUsuario || "seu@email.com"}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewNotification(false)}
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                setPreviewNotification(false);
                handleTestarEmail();
              }}
              disabled={!emailUsuario || !!emailError}
            >
              Enviar Teste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showKeyboardShortcuts}
        onOpenChange={setShowKeyboardShortcuts}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Atalhos de Teclado
            </DialogTitle>
            <DialogDescription>
              Atalhos disponíveis na plataforma. Você pode personalizar alguns
              deles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Search className="h-4 w-4" />
                Navegação
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                  <div>
                    <div className="font-medium text-sm">Buscar</div>
                    <div className="text-xs text-muted-foreground">
                      Abrir busca rápida
                    </div>
                  </div>
                  <kbd className="px-2.5 py-1.5 rounded border bg-background font-mono text-xs">
                    ⌘K
                  </kbd>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                  <div>
                    <div className="font-medium text-sm">
                      Pular para conteúdo
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Navegação por teclado
                    </div>
                  </div>
                  <kbd className="px-2.5 py-1.5 rounded border bg-background font-mono text-xs">
                    Tab
                  </kbd>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configurações
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                  <div>
                    <div className="font-medium text-sm">Fechar diálogo</div>
                    <div className="text-xs text-muted-foreground">
                      Fechar qualquer diálogo aberto
                    </div>
                  </div>
                  <kbd className="px-2.5 py-1.5 rounded border bg-background font-mono text-xs">
                    Esc
                  </kbd>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                * Personalização de atalhos em breve
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowKeyboardShortcuts(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmDeleteDomain.open}
        onOpenChange={(open) =>
          setConfirmDeleteDomain({
            open,
            domainId: confirmDeleteDomain.domainId,
            domainName: confirmDeleteDomain.domainName,
          })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o domínio{" "}
              <strong>{confirmDeleteDomain.domainName}</strong>?
              <br />
              <span className="text-red-500 font-medium">
                Esta ação não pode ser desfeita.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDomain}
              className="bg-red-500 hover:bg-red-600"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmClearData} onOpenChange={setConfirmClearData}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar Limpeza de Dados
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja limpar todos os dados locais?
              <br />
              <span className="text-red-500 font-medium">
                Esta ação não pode ser desfeita.
              </span>
              <br />
              <br />
              Os seguintes dados serão removidos:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Avaliações e disciplinas</li>
                <li>Progresso de horas assistidas</li>
                <li>Configurações de notificações</li>
              </ul>
              <br />
              <span className="text-green-600 dark:text-green-400 font-medium">
                Tokens de autenticação (Google Calendar) serão preservados.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarLimparDados}
              className="bg-red-500 hover:bg-red-600"
            >
              Limpar Dados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
