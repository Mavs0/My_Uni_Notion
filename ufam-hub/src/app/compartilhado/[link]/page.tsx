"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Share2,
  Download,
  Heart,
  MessageSquare,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
interface NotaCompartilhada {
  id: string;
  titulo: string;
  descricao?: string;
  content_md?: string;
  visualizacoes: number;
  curtidas: number;
  permite_download: boolean;
  permite_comentarios: boolean;
  created_at: string;
  usuario?: {
    id: string;
    raw_user_meta_data?: {
      nome?: string;
      email?: string;
    };
  };
}
export default function CompartilhadoPage() {
  const params = useParams();
  const link = params.link as string;
  const [nota, setNota] = useState<NotaCompartilhada | null>(null);
  const [loading, setLoading] = useState(true);
  const [codigo, setCodigo] = useState("");
  const [requerCodigo, setRequerCodigo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNota();
  }, [link]);

  const loadNota = async (codigoAcesso?: string) => {
    try {
      setLoading(true);
      setError(null);
      const url = codigoAcesso
        ? `/api/colaboracao/compartilhar?link=${link}&codigo=${codigoAcesso}`
        : `/api/colaboracao/compartilhar?link=${link}`;
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setNota(data);
        setRequerCodigo(false);
      } else if (data.requer_codigo) {
        setRequerCodigo(true);
        setError(data.error || "Código de acesso necessário");
      } else if (data.requer_email) {
        setError(`Esta anotação é restrita ao email: ${data.email_permitido}`);
      } else {
        setError(data.error || "Anotação não encontrada");
        toast.error(data.error || "Anotação não encontrada");
      }
    } catch (error) {
      console.error("Erro ao carregar anotação:", error);
      toast.error("Erro ao carregar anotação");
      setError("Erro ao carregar anotação");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCodigo = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.trim()) {
      loadNota(codigo.trim());
    }
  };
  if (loading) {
    return (
      <main className="mx-auto max-w-4xl p-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (requerCodigo) {
    return (
      <main className="mx-auto max-w-4xl p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Acesso Restrito
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Esta anotação é privada. Por favor, insira o código de acesso para
              visualizar.
            </p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <form onSubmit={handleSubmitCodigo} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="codigo" className="text-sm font-medium">
                  Código de Acesso
                </label>
                <Input
                  id="codigo"
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Digite o código de 6 dígitos"
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Acessar
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!nota) {
    return (
      <main className="mx-auto max-w-4xl p-4">
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">
              {error || "Anotação não encontrada"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {error
                ? error
                : "Esta anotação pode ter sido removida ou o link está inválido."}
            </p>
            <Button asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-4xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copiado!");
            }}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{nota.titulo}</CardTitle>
          {nota.descricao && (
            <p className="text-muted-foreground mt-2">{nota.descricao}</p>
          )}
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span>
              Por:{" "}
              {nota.usuario?.raw_user_meta_data?.nome ||
                nota.usuario?.raw_user_meta_data?.email ||
                "Usuário"}
            </span>
            <span>•</span>
            <span>{nota.visualizacoes} visualizações</span>
            <span>•</span>
            <span>{nota.curtidas} curtidas</span>
          </div>
        </CardHeader>
        <CardContent>
          {nota.content_md ? (
            <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
              {nota.content_md}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum conteúdo disponível.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
