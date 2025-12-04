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
  Library,
  Search,
  Filter,
  FileText,
  Download,
  Heart,
  Eye,
  User,
} from "lucide-react";
import { toast } from "sonner";
interface Material {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: string;
  categoria?: string;
  arquivo_url?: string;
  visualizacoes: number;
  downloads: number;
  curtidas: number;
  created_at: string;
  usuario?: {
    id: string;
    raw_user_meta_data?: {
      nome?: string;
      email?: string;
    };
  };
}
export default function BibliotecaPage() {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("");
  useEffect(() => {
    loadMateriais();
  }, [filtroTipo, filtroCategoria]);
  const loadMateriais = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("busca", search);
      if (filtroTipo) params.append("tipo", filtroTipo);
      if (filtroCategoria) params.append("categoria", filtroCategoria);
      const response = await fetch(
        `/api/colaboracao/biblioteca?${params.toString()}`
      );
      if (response.ok) {
        const { materiais: materiaisData } = await response.json();
        setMateriais(materiaisData || []);
      } else {
        toast.error("Erro ao carregar materiais");
      }
    } catch (error) {
      console.error("Erro ao carregar materiais:", error);
      toast.error("Erro ao carregar materiais");
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = () => {
    loadMateriais();
  };
  const filteredMateriais = materiais.filter((material) =>
    material.titulo.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <main className="mx-auto max-w-6xl p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Biblioteca de Materiais</h1>
        <p className="text-muted-foreground mt-1">
          Explore e compartilhe materiais de estudo
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Buscar materiais..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Todos os tipos</option>
            <option value="anotacao">Anotação</option>
            <option value="arquivo">Arquivo</option>
            <option value="link">Link</option>
            <option value="flashcard">Flashcard</option>
          </select>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Todas as categorias</option>
            <option value="apostila">Apostila</option>
            <option value="resumo">Resumo</option>
            <option value="exercicio">Exercício</option>
            <option value="prova">Prova</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando materiais...</p>
        </div>
      ) : filteredMateriais.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Library className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {materiais.length === 0
                ? "Nenhum material ainda"
                : "Nenhum material encontrado"}
            </h3>
            <p className="text-muted-foreground">
              {materiais.length === 0
                ? "A biblioteca está vazia. Compartilhe materiais para começar!"
                : "Tente buscar com outros termos ou ajustar os filtros"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMateriais.map((material) => (
            <Card
              key={material.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <CardTitle className="text-lg">{material.titulo}</CardTitle>
                {material.descricao && (
                  <CardDescription className="mt-1 line-clamp-2">
                    {material.descricao}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{material.visualizacoes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      <span>{material.downloads}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span>{material.curtidas}</span>
                    </div>
                  </div>
                  {material.usuario && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>
                        {material.usuario.raw_user_meta_data?.nome ||
                          material.usuario.raw_user_meta_data?.email ||
                          "Usuário"}
                      </span>
                    </div>
                  )}
                  {material.arquivo_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        window.open(material.arquivo_url, "_blank");
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}