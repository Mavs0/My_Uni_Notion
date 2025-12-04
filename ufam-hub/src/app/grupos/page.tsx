"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Plus,
  Search,
  MessageSquare,
  Calendar,
  User,
  Settings,
  LogOut,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
interface Grupo {
  id: string;
  nome: string;
  descricao?: string;
  criador_id: string;
  visibilidade: string;
  link_convite: string;
  created_at: string;
  criador?: {
    id: string;
    raw_user_meta_data?: {
      nome?: string;
      email?: string;
    };
  };
}
export default function GruposPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    visibilidade: "publico",
  });
  useEffect(() => {
    loadGrupos();
  }, []);
  const loadGrupos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/colaboracao/grupos?meus_grupos=true");
      if (response.ok) {
        const { grupos: gruposData } = await response.json();
        setGrupos(gruposData || []);
      } else {
        toast.error("Erro ao carregar grupos");
      }
    } catch (error) {
      console.error("Erro ao carregar grupos:", error);
      toast.error("Erro ao carregar grupos");
    } finally {
      setLoading(false);
    }
  };
  const handleCreateGrupo = async () => {
    if (!formData.nome.trim()) {
      toast.error("Nome do grupo é obrigatório");
      return;
    }
    try {
      const response = await fetch("/api/colaboracao/grupos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const { grupo } = await response.json();
        toast.success("Grupo criado com sucesso!");
        setShowCreateDialog(false);
        setFormData({ nome: "", descricao: "", visibilidade: "publico" });
        loadGrupos();
      } else {
        const { error } = await response.json();
        toast.error(error || "Erro ao criar grupo");
      }
    } catch (error) {
      console.error("Erro ao criar grupo:", error);
      toast.error("Erro ao criar grupo");
    }
  };
  const filteredGrupos = grupos.filter((grupo) =>
    grupo.nome.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <main className="mx-auto max-w-6xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Grupos de Estudo</h1>
          <p className="text-muted-foreground mt-1">
            Colabore e estude junto com seus colegas
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Grupo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Grupo</DialogTitle>
              <DialogDescription>
                Crie um grupo de estudo para colaborar com seus colegas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome do Grupo</label>
                <Input
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  placeholder="Ex: Grupo de Cálculo I"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  placeholder="Descreva o propósito do grupo..."
                  className="mt-1 w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Visibilidade</label>
                <select
                  value={formData.visibilidade}
                  onChange={(e) =>
                    setFormData({ ...formData, visibilidade: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="publico">Público</option>
                  <option value="privado">Privado</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateGrupo}>Criar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar grupos..."
          className="pl-9"
        />
      </div>
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Users className="size-12 animate-pulse mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando grupos...</p>
          </div>
        </div>
      ) : filteredGrupos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {grupos.length === 0
                ? "Nenhum grupo ainda"
                : "Nenhum grupo encontrado"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {grupos.length === 0
                ? "Crie seu primeiro grupo de estudo para começar a colaborar!"
                : "Tente buscar com outros termos"}
            </p>
            {grupos.length === 0 && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Grupo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGrupos.map((grupo) => (
            <Card key={grupo.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{grupo.nome}</CardTitle>
                    {grupo.descricao && (
                      <CardDescription className="mt-1">
                        {grupo.descricao}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>
                      {grupo.criador?.raw_user_meta_data?.nome ||
                        grupo.criador?.raw_user_meta_data?.email ||
                        "Criador"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(grupo.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      asChild
                      variant="default"
                      className="flex-1"
                      size="sm"
                    >
                      <Link href={`/grupos/${grupo.id}`}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Abrir
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = `${window.location.origin}/grupos/convite/${grupo.link_convite}`;
                        navigator.clipboard.writeText(link);
                        toast.success("Link de convite copiado!");
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}