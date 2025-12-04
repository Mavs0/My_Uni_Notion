"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  MessageSquare,
  Users,
  Send,
  ArrowLeft,
  User,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
interface Mensagem {
  id: string;
  mensagem: string;
  created_at: string;
  usuario?: {
    id: string;
    raw_user_meta_data?: {
      nome?: string;
      email?: string;
    };
  };
}
interface Membro {
  id: string;
  role: string;
  usuario?: {
    id: string;
    raw_user_meta_data?: {
      nome?: string;
      email?: string;
    };
  };
}
export default function GrupoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const grupoId = params.id as string;
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadMensagens();
    loadMembros();
    const interval = setInterval(loadMensagens, 5000);
    return () => clearInterval(interval);
  }, [grupoId]);
  const loadMensagens = async () => {
    try {
      const response = await fetch(
        `/api/colaboracao/grupos/${grupoId}/mensagens`
      );
      if (response.ok) {
        const { mensagens: mensagensData } = await response.json();
        setMensagens(mensagensData || []);
      }
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    } finally {
      setLoading(false);
    }
  };
  const loadMembros = async () => {
    try {
      const response = await fetch(
        `/api/colaboracao/grupos/${grupoId}/membros`
      );
      if (response.ok) {
        const { membros: membrosData } = await response.json();
        setMembros(membrosData || []);
      }
    } catch (error) {
      console.error("Erro ao carregar membros:", error);
    }
  };
  const handleEnviarMensagem = async () => {
    if (!novaMensagem.trim()) return;
    try {
      const response = await fetch(
        `/api/colaboracao/grupos/${grupoId}/mensagens`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mensagem: novaMensagem }),
        }
      );
      if (response.ok) {
        setNovaMensagem("");
        loadMensagens();
      } else {
        const { error } = await response.json();
        toast.error(error || "Erro ao enviar mensagem");
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem");
    }
  };
  return (
    <main className="mx-auto max-w-6xl p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/grupos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Grupo de Estudo</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat do Grupo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-[400px] overflow-y-auto space-y-3 pr-2">
                {loading ? (
                  <p className="text-muted-foreground text-center py-8">
                    Carregando mensagens...
                  </p>
                ) : mensagens.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma mensagem ainda. Seja o primeiro a escrever!
                  </p>
                ) : (
                  mensagens
                    .slice()
                    .reverse()
                    .map((msg) => (
                      <div key={msg.id} className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-medium">
                            {msg.usuario?.raw_user_meta_data?.nome ||
                              msg.usuario?.raw_user_meta_data?.email ||
                              "Usuário"}
                          </span>
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString(
                              "pt-BR",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                        <div className="rounded-lg bg-muted p-3">
                          <p className="text-sm">{msg.mensagem}</p>
                        </div>
                      </div>
                    ))
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleEnviarMensagem();
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                />
                <Button onClick={handleEnviarMensagem}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        {}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Membros ({membros.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {membros.map((membro) => (
                  <div
                    key={membro.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {membro.usuario?.raw_user_meta_data?.nome ||
                          membro.usuario?.raw_user_meta_data?.email ||
                          "Usuário"}
                      </span>
                    </div>
                    {membro.role === "admin" && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        Admin
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}