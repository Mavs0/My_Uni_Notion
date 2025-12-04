"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Share2,
  Download,
  Heart,
  MessageSquare,
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
  useEffect(() => {
    loadNota();
  }, [link]);
  const loadNota = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/colaboracao/compartilhar?link=${link}`
      );
      if (response.ok) {
        const data = await response.json();
        setNota(data);
      } else {
        toast.error("Anotação não encontrada");
      }
    } catch (error) {
      console.error("Erro ao carregar anotação:", error);
      toast.error("Erro ao carregar anotação");
    } finally {
      setLoading(false);
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
  if (!nota) {
    return (
      <main className="mx-auto max-w-4xl p-4">
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">
              Anotação não encontrada
            </h2>
            <p className="text-muted-foreground mb-4">
              Esta anotação pode ter sido removida ou o link está inválido.
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