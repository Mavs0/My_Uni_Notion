"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Calendar,
  Search,
  Filter,
  MapPin,
  Clock,
  Users,
  Share2,
  Bell,
  BellOff,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  List,
  Grid,
  BookOpen,
  GraduationCap,
  Music,
  Trophy,
  Mic,
  Building2,
  PartyPopper,
  Megaphone,
  Copy,
  MessageCircle,
  Send,
  Plus,
  Edit,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CategoriaEvento =
  | "academico"
  | "cultural"
  | "esportivo"
  | "formatura"
  | "palestra"
  | "institucional"
  | "social"
  | "divulgacao";

interface EventoAcademico {
  id: string;
  titulo: string;
  descricao: string;
  categoria: CategoriaEvento;
  data_inicio: string;
  data_fim?: string;
  local?: string;
  link_externo?: string;
  imagem_url?: string;
  curso_nome?: string;
  publico: boolean;
  total_interessados: number;
  interessado: boolean;
  vou_participar: boolean;
  criado_por?: string;
}

const eventosMockados: EventoAcademico[] = [
  {
    id: "1",
    titulo: "Semana Acadêmica de Ciências da Computação",
    descricao:
      "Uma semana repleta de palestras, workshops e atividades relacionadas à área de computação. Venha conhecer as últimas tendências tecnológicas!",
    categoria: "academico",
    data_inicio: "2025-03-15T08:00:00",
    data_fim: "2025-03-19T18:00:00",
    local: "Auditório Central - Bloco A",
    link_externo: "https://example.com",
    curso_nome: "Ciência da Computação",
    publico: true,
    total_interessados: 145,
    interessado: false,
    vou_participar: false,
  },
  {
    id: "2",
    titulo: "Festival de Música Universitária",
    descricao: "Apresentações musicais de estudantes e bandas locais. Venha prestigiar o talento da nossa universidade!",
    categoria: "cultural",
    data_inicio: "2025-03-20T19:00:00",
    data_fim: "2025-03-20T23:00:00",
    local: "Anfiteatro",
    publico: true,
    total_interessados: 89,
    interessado: true,
    vou_participar: false,
  },
  {
    id: "3",
    titulo: "Jogos Intercursos - Fase Final",
    descricao: "Final dos jogos intercursos com disputas emocionantes em diversas modalidades esportivas.",
    categoria: "esportivo",
    data_inicio: "2025-03-25T14:00:00",
    data_fim: "2025-03-25T18:00:00",
    local: "Ginásio de Esportes",
    publico: true,
    total_interessados: 234,
    interessado: false,
    vou_participar: true,
  },
  {
    id: "4",
    titulo: "Palestra: Inteligência Artificial e o Futuro",
    descricao: "Palestra com especialista sobre as tendências e impactos da IA no mercado de trabalho.",
    categoria: "palestra",
    data_inicio: "2025-03-18T14:00:00",
    data_fim: "2025-03-18T16:00:00",
    local: "Sala 101 - Bloco B",
    link_externo: "https://example.com/palestra",
    publico: true,
    total_interessados: 67,
    interessado: true,
    vou_participar: true,
  },
  {
    id: "5",
    titulo: "Período de Matrícula 2025.2",
    descricao: "Início do período de matrícula para o semestre 2025.2. Verifique os prazos e documentos necessários.",
    categoria: "academico",
    data_inicio: "2025-04-01T08:00:00",
    data_fim: "2025-04-15T18:00:00",
    local: "Sistema Online",
    publico: true,
    total_interessados: 0,
    interessado: false,
    vou_participar: false,
  },
  {
    id: "6",
    titulo: "Cerimônia de Colação de Grau - Turma 2024.2",
    descricao: "Cerimônia oficial de colação de grau para os formandos do segundo semestre de 2024.",
    categoria: "formatura",
    data_inicio: "2025-04-10T18:00:00",
    data_fim: "2025-04-10T21:00:00",
    local: "Centro de Convenções",
    publico: true,
    total_interessados: 156,
    interessado: false,
    vou_participar: false,
  },
  {
    id: "7",
    titulo: "Workshop: Desenvolvimento Mobile",
    descricao: "Workshop prático sobre desenvolvimento de aplicativos móveis com React Native.",
    categoria: "palestra",
    data_inicio: "2025-03-22T09:00:00",
    data_fim: "2025-03-22T12:00:00",
    local: "Laboratório de Informática - Bloco C",
    publico: true,
    total_interessados: 45,
    interessado: false,
    vou_participar: false,
  },
  {
    id: "8",
    titulo: "Confra Estudantil",
    descricao: "Confraternização entre estudantes para celebrar o fim do semestre. Música, comida e diversão!",
    categoria: "social",
    data_inicio: "2025-04-05T19:00:00",
    data_fim: "2025-04-05T23:00:00",
    local: "Área Externa - Bloco D",
    publico: true,
    total_interessados: 312,
    interessado: true,
    vou_participar: false,
  },
];

const categoriasConfig: Record<
  CategoriaEvento,
  { label: string; icon: typeof Calendar; color: string; bgColor: string }
> = {
  academico: {
    label: "Acadêmico",
    icon: BookOpen,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  cultural: {
    label: "Cultural",
    icon: Music,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
  },
  esportivo: {
    label: "Esportivo",
    icon: Trophy,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
  },
  formatura: {
    label: "Formatura",
    icon: GraduationCap,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  palestra: {
    label: "Palestra",
    icon: Mic,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
  },
  institucional: {
    label: "Institucional",
    icon: Building2,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
  },
  social: {
    label: "Social",
    icon: PartyPopper,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
  },
  divulgacao: {
    label: "Divulgação",
    icon: Megaphone,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
  },
};

export default function EventosPage() {
  const [viewMode, setViewMode] = useState<"calendario" | "lista">("lista");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas");
  const [selectedEvento, setSelectedEvento] = useState<EventoAcademico | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventos, setEventos] = useState<EventoAcademico[]>([]);
  const [loading, setLoading] = useState(true);
  const [canCreateEventos, setCanCreateEventos] = useState(true); // Iniciar como true para mostrar o botão
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showEventoForm, setShowEventoForm] = useState(false);
  const [editingEvento, setEditingEvento] = useState<EventoAcademico | null>(null);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    categoria: "academico" as CategoriaEvento,
    data_inicio: "",
    data_fim: "",
    local: "",
    link_externo: "",
    imagem_url: "",
    curso_id: "",
    disciplina_id: "",
    publico: true,
    recorrente: false,
    tipo_recorrencia: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [eventoToDelete, setEventoToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadEventos();
    checkCanCreateEventos();
  }, []);

  const checkCanCreateEventos = async () => {
    try {
      const profileRes = await fetch("/api/profile");
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.profile?.id) {
          setCanCreateEventos(true); // Usuário autenticado pode criar eventos
          setCurrentUserId(profileData.profile.id);
        } else {
          setCanCreateEventos(false);
          setCurrentUserId(null);
        }
      } else {
        setCanCreateEventos(false);
        setCurrentUserId(null);
      }
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      setCanCreateEventos(false);
      setCurrentUserId(null);
    }
  };

  const loadEventos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoriaFiltro !== "todas") {
        params.append("categoria", categoriaFiltro);
      }
      const res = await fetch(`/api/eventos-academicos?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEventos(data.eventos || []);
      } else {
        setEventos(eventosMockados);
      }
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
      setEventos(eventosMockados);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventos();
  }, [categoriaFiltro]);

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((evento) => {
      const matchSearch =
        evento.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evento.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evento.local?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategoria =
        categoriaFiltro === "todas" || evento.categoria === categoriaFiltro;

      return matchSearch && matchCategoria;
    });
  }, [eventos, searchTerm, categoriaFiltro]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days: (Date | null)[] = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      if (current.getMonth() === month && current <= lastDay) {
        days.push(new Date(current));
      } else {
        days.push(null);
      }
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    return eventosFiltrados.filter((evento) => {
      const eventoDate = new Date(evento.data_inicio);
      return (
        eventoDate.getDate() === date.getDate() &&
        eventoDate.getMonth() === date.getMonth() &&
        eventoDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleInteresse = async (eventoId: string) => {
    try {
      const evento = eventos.find((e) => e.id === eventoId);
      if (!evento) return;

      if (evento.interessado) {
        const res = await fetch(`/api/eventos-academicos/${eventoId}/interesse`, {
          method: "DELETE",
        });
        if (res.ok) {
          setEventos((prev) =>
            prev.map((e) =>
              e.id === eventoId
                ? {
                    ...e,
                    interessado: false,
                    total_interessados: Math.max(0, e.total_interessados - 1),
                  }
                : e
            )
          );
          toast.success("Interesse removido");
        }
      } else {
        const res = await fetch(`/api/eventos-academicos/${eventoId}/interesse`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "interessado" }),
        });
        if (res.ok) {
          setEventos((prev) =>
            prev.map((e) =>
              e.id === eventoId
                ? {
                    ...e,
                    interessado: true,
                    total_interessados: e.total_interessados + 1,
                  }
                : e
            )
          );
          toast.success("Interesse marcado");
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar interesse:", error);
      toast.error("Erro ao atualizar interesse");
    }
  };

  const handleParticipar = async (eventoId: string) => {
    try {
      const evento = eventos.find((e) => e.id === eventoId);
      if (!evento) return;

      if (evento.vou_participar) {
        const res = await fetch(`/api/eventos-academicos/${eventoId}/interesse`, {
          method: "DELETE",
        });
        if (res.ok) {
          setEventos((prev) =>
            prev.map((e) =>
              e.id === eventoId
                ? {
                    ...e,
                    vou_participar: false,
                    interessado: false,
                  }
                : e
            )
          );
          toast.success("Participação removida");
        }
      } else {
        const res = await fetch(`/api/eventos-academicos/${eventoId}/interesse`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "vou_participar" }),
        });
        if (res.ok) {
          setEventos((prev) =>
            prev.map((e) =>
              e.id === eventoId
                ? {
                    ...e,
                    vou_participar: true,
                    interessado: true,
                  }
                : e
            )
          );
          toast.success("Participação confirmada!");
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar participação:", error);
      toast.error("Erro ao atualizar participação");
    }
  };

  const getEventoLink = (evento: EventoAcademico) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/eventos?id=${evento.id}`;
  };

  const handleCopyLink = async (evento: EventoAcademico) => {
    const link = getEventoLink(evento);
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado para a área de transferência!");
    } catch (err) {
      toast.error("Erro ao copiar link");
    }
  };

  const handleShareWhatsApp = (evento: EventoAcademico) => {
    const link = getEventoLink(evento);
    const text = encodeURIComponent(
      `Confira este evento: ${evento.titulo}\n\n${evento.descricao}\n\n${link}`
    );
    const whatsappUrl = `https://wa.me/?text=${text}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleShareTelegram = (evento: EventoAcademico) => {
    const link = getEventoLink(evento);
    const text = encodeURIComponent(
      `Confira este evento: ${evento.titulo}\n\n${evento.descricao}\n\n${link}`
    );
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`;
    window.open(telegramUrl, "_blank");
  };

  const handleCreateEvento = () => {
    setEditingEvento(null);
    setFormData({
      titulo: "",
      descricao: "",
      categoria: "academico",
      data_inicio: "",
      data_fim: "",
      local: "",
      link_externo: "",
      imagem_url: "",
      curso_id: "",
      disciplina_id: "",
      publico: true,
      recorrente: false,
      tipo_recorrencia: "",
    });
    setShowEventoForm(true);
  };

  const handleEditEvento = (evento: EventoAcademico) => {
    setEditingEvento(evento);
    const formatDateTimeLocal = (dateString: string) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setFormData({
      titulo: evento.titulo,
      descricao: evento.descricao,
      categoria: evento.categoria,
      data_inicio: formatDateTimeLocal(evento.data_inicio),
      data_fim: evento.data_fim ? formatDateTimeLocal(evento.data_fim) : "",
      local: evento.local || "",
      link_externo: evento.link_externo || "",
      imagem_url: evento.imagem_url || "",
      curso_id: "",
      disciplina_id: "",
      publico: evento.publico,
      recorrente: false,
      tipo_recorrencia: "",
    });
    setShowEventoForm(true);
  };

  const handleSubmitEvento = async () => {
    if (!formData.titulo.trim() || !formData.categoria || !formData.data_inicio) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setSubmitting(true);
      const url = editingEvento
        ? `/api/eventos-academicos/${editingEvento.id}`
        : "/api/eventos-academicos";
      const method = editingEvento ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          data_inicio: new Date(formData.data_inicio).toISOString(),
          data_fim: formData.data_fim
            ? new Date(formData.data_fim).toISOString()
            : null,
          curso_id: formData.curso_id || null,
          disciplina_id: formData.disciplina_id || null,
          tipo_recorrencia: formData.tipo_recorrencia || null,
        }),
      });

      if (res.ok) {
        toast.success(
          editingEvento ? "Evento atualizado com sucesso!" : "Evento criado com sucesso!"
        );
        setShowEventoForm(false);
        setEditingEvento(null);
        loadEventos();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao salvar evento");
      }
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
      toast.error("Erro ao salvar evento");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvento = async () => {
    if (!eventoToDelete) return;

    try {
      const res = await fetch(`/api/eventos-academicos/${eventoToDelete}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Evento deletado com sucesso!");
        setEventoToDelete(null);
        loadEventos();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao deletar evento");
      }
    } catch (error) {
      console.error("Erro ao deletar evento:", error);
      toast.error("Erro ao deletar evento");
    }
  };

  const CategoriaIcon = categoriasConfig[selectedEvento?.categoria || "academico"].icon;

  return (
    <div className="w-full py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Eventos Acadêmicos</h1>
          <p className="text-muted-foreground">
            Fique por dentro dos eventos e atividades da universidade
          </p>
        </div>
        {canCreateEventos && (
          <Button onClick={handleCreateEvento}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Evento
          </Button>
        )}
      </div>

      {/* Filtros e Busca */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro de Categoria */}
            <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {Object.entries(categoriasConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Toggle de Vista */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === "lista" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("lista")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "calendario" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("calendario")}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo */}
      {viewMode === "lista" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventosFiltrados.map((evento) => {
            const categoria = categoriasConfig[evento.categoria];
            const Icon = categoria.icon;

            return (
              <Card
                key={evento.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedEvento(evento)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge
                      className={cn(
                        "flex items-center gap-1",
                        categoria.bgColor,
                        categoria.color
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {categoria.label}
                    </Badge>
                    {evento.vou_participar && (
                      <Badge variant="default" className="bg-green-500">
                        Vou participar
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{evento.titulo}</CardTitle>
                  {evento.curso_nome && (
                    <CardDescription className="text-xs">
                      {evento.curso_nome}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {evento.descricao}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDateTime(evento.data_inicio)}</span>
                    </div>
                    {evento.local && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{evento.local}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{evento.total_interessados} interessados</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant={evento.interessado ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInteresse(evento.id);
                      }}
                    >
                      {evento.interessado ? (
                        <>
                          <Bell className="h-4 w-4 mr-1" />
                          Interessado
                        </>
                      ) : (
                        <>
                          <BellOff className="h-4 w-4 mr-1" />
                          Marcar interesse
                        </>
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyLink(evento);
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar link
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareWhatsApp(evento);
                          }}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Compartilhar no WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareTelegram(evento);
                          }}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Compartilhar no Telegram
                        </DropdownMenuItem>
                        {canCreateEventos && evento.criado_por === currentUserId && (
                          <>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEvento(evento);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setEventoToDelete(evento.id);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deletar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {currentDate.toLocaleDateString("pt-BR", {
                    month: "long",
                    year: "numeric",
                  })}
                </CardTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth("prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setCurrentDate(new Date());
                  }}
                >
                  Hoje
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth("next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-7 bg-muted/50 border-b">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="p-3 text-center text-xs font-semibold text-muted-foreground uppercase"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {getCalendarDays().map((date, index) => {
                  const isToday =
                    date &&
                    date.getDate() === new Date().getDate() &&
                    date.getMonth() === new Date().getMonth() &&
                    date.getFullYear() === new Date().getFullYear();

                  const isCurrentMonth =
                    date && date.getMonth() === currentDate.getMonth();

                  const dayEvents = date ? getEventsForDate(date) : [];

                  if (!date) {
                    return <div key={index} className="aspect-square" />;
                  }

                  return (
                    <div
                      key={index}
                      className={cn(
                        "aspect-square border-r border-b p-2 min-h-[100px]",
                        !isCurrentMonth && "opacity-40 bg-muted/20",
                        isToday && "bg-primary/10"
                      )}
                    >
                      <div
                        className={cn(
                          "text-sm font-medium mb-1",
                          isToday && "text-primary font-bold"
                        )}
                      >
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((evento) => {
                          const categoria = categoriasConfig[evento.categoria];
                          return (
                            <div
                              key={evento.id}
                              className={cn(
                                "text-xs p-1 rounded cursor-pointer hover:opacity-80",
                                categoria.bgColor,
                                categoria.color
                              )}
                              onClick={() => setSelectedEvento(evento)}
                            >
                              <div className="truncate">{evento.titulo}</div>
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 2} mais
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">Carregando eventos...</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && eventosFiltrados.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum evento encontrado</h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou buscar por outros termos
            </p>
            {canCreateEventos && (
              <Button onClick={handleCreateEvento} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Evento
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de Detalhes */}
      <Dialog open={!!selectedEvento} onOpenChange={() => setSelectedEvento(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedEvento && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge
                    className={cn(
                      "flex items-center gap-1",
                      categoriasConfig[selectedEvento.categoria].bgColor,
                      categoriasConfig[selectedEvento.categoria].color
                    )}
                  >
                    <CategoriaIcon className="h-3 w-3" />
                    {categoriasConfig[selectedEvento.categoria].label}
                  </Badge>
                  {selectedEvento.vou_participar && (
                    <Badge variant="default" className="bg-green-500">
                      Vou participar
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-2xl">{selectedEvento.titulo}</DialogTitle>
                {selectedEvento.curso_nome && (
                  <DialogDescription>{selectedEvento.curso_nome}</DialogDescription>
                )}
              </DialogHeader>

              <div className="space-y-4">
                <p className="text-muted-foreground">{selectedEvento.descricao}</p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {formatDate(selectedEvento.data_inicio)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatTime(selectedEvento.data_inicio)}
                        {selectedEvento.data_fim && ` - ${formatTime(selectedEvento.data_fim)}`}
                      </div>
                    </div>
                  </div>

                  {selectedEvento.local && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Local</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedEvento.local}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Interessados</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedEvento.total_interessados} pessoas interessadas
                      </div>
                    </div>
                  </div>

                  {selectedEvento.link_externo && (
                    <div className="flex items-center gap-3">
                      <ExternalLink className="h-5 w-5 text-muted-foreground" />
                      <a
                        href={selectedEvento.link_externo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Ver mais informações
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant={selectedEvento.interessado ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => handleInteresse(selectedEvento.id)}
                  >
                    {selectedEvento.interessado ? (
                      <>
                        <Bell className="h-4 w-4 mr-2" />
                        Interessado
                      </>
                    ) : (
                      <>
                        <BellOff className="h-4 w-4 mr-2" />
                        Marcar interesse
                      </>
                    )}
                  </Button>
                  <Button
                    variant={selectedEvento.vou_participar ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => handleParticipar(selectedEvento.id)}
                  >
                    {selectedEvento.vou_participar ? "Vou participar" : "Confirmar presença"}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleCopyLink(selectedEvento)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShareWhatsApp(selectedEvento)}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Compartilhar no WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShareTelegram(selectedEvento)}>
                        <Send className="h-4 w-4 mr-2" />
                        Compartilhar no Telegram
                      </DropdownMenuItem>
                      {canCreateEventos && selectedEvento.criado_por === currentUserId && (
                        <>
                          <DropdownMenuItem onClick={() => handleEditEvento(selectedEvento)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setEventoToDelete(selectedEvento.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Deletar
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Formulário de Evento */}
      <Dialog open={showEventoForm} onOpenChange={setShowEventoForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEvento ? "Editar Evento" : "Criar Novo Evento"}
            </DialogTitle>
            <DialogDescription>
              {editingEvento
                ? "Atualize as informações do evento"
                : "Preencha os dados para criar um novo evento acadêmico"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">
                Título <span className="text-red-500">*</span>
              </Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) =>
                  setFormData({ ...formData, titulo: e.target.value })
                }
                placeholder="Ex: Semana Acadêmica de Ciências"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Descreva o evento..."
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">
                  Categoria <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      categoria: value as CategoriaEvento,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoriasConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publico">Visibilidade</Label>
                <Select
                  value={formData.publico ? "publico" : "privado"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, publico: value === "publico" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publico">Público</SelectItem>
                    <SelectItem value="privado">Privado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_inicio">
                  Data e Hora de Início <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="data_inicio"
                  type="datetime-local"
                  value={formData.data_inicio}
                  onChange={(e) =>
                    setFormData({ ...formData, data_inicio: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_fim">Data e Hora de Fim</Label>
                <Input
                  id="data_fim"
                  type="datetime-local"
                  value={formData.data_fim}
                  onChange={(e) =>
                    setFormData({ ...formData, data_fim: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="local">Local</Label>
              <Input
                id="local"
                value={formData.local}
                onChange={(e) =>
                  setFormData({ ...formData, local: e.target.value })
                }
                placeholder="Ex: Auditório Central - Bloco A"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link_externo">Link Externo</Label>
              <Input
                id="link_externo"
                type="url"
                value={formData.link_externo}
                onChange={(e) =>
                  setFormData({ ...formData, link_externo: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imagem_url">URL da Imagem</Label>
              <Input
                id="imagem_url"
                type="url"
                value={formData.imagem_url}
                onChange={(e) =>
                  setFormData({ ...formData, imagem_url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recorrente"
                checked={formData.recorrente}
                onChange={(e) =>
                  setFormData({ ...formData, recorrente: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="recorrente" className="cursor-pointer">
                Evento recorrente
              </Label>
            </div>

            {formData.recorrente && (
              <div className="space-y-2">
                <Label htmlFor="tipo_recorrencia">Tipo de Recorrência</Label>
                <Select
                  value={formData.tipo_recorrencia}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipo_recorrencia: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anual">Anual</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEventoForm(false);
                setEditingEvento(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmitEvento} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  {editingEvento ? "Atualizar" : "Criar"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog
        open={!!eventoToDelete}
        onOpenChange={(open) => !open && setEventoToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Deletar Evento
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar este evento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEventoToDelete(null)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteEvento}>
              <Trash2 className="h-4 w-4 mr-2" />
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
