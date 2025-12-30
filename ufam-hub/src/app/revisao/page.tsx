"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFlashcards, type Flashcard } from "@/hooks/useFlashcards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  RotateCcw,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Plus,
  Sparkles,
  BookOpen,
  Brain,
} from "lucide-react";
import { toast } from "sonner";
import { useDisciplinas } from "@/hooks/useDisciplinas";
export default function RevisaoPage() {
  const router = useRouter();
  const [mostrarVerso, setMostrarVerso] = useState(false);
  const [flashcardAtual, setFlashcardAtual] = useState<Flashcard | null>(null);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [modoRevisao, setModoRevisao] = useState(false);
  const [openCriar, setOpenCriar] = useState(false);
  const [openGerar, setOpenGerar] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [flashcardPreview, setFlashcardPreview] = useState<Flashcard | null>(
    null
  );
  const [disciplinaGerar, setDisciplinaGerar] = useState("");
  const [quantidadeGerar, setQuantidadeGerar] = useState(5);
  const { disciplinas } = useDisciplinas();
  const {
    flashcards,
    loading,
    error,
    refetch,
    revisarFlashcard,
    createFlashcard,
    gerarFlashcards,
  } = useFlashcards(); // Sempre buscar todos os flashcards
  const flashcardsParaRevisar = flashcards.filter((fc) => {
    if (!modoRevisao) return false; // Quando não está em modo revisão, não mostrar na lista de revisão
    if (!fc.revisao) return true; // Se não tem revisão, precisa revisar
    const proximaRevisao = new Date(fc.revisao.proxima_revisao);
    return proximaRevisao <= new Date(); // Se a próxima revisão já passou, precisa revisar
  });
  useEffect(() => {
    if (flashcardsParaRevisar.length > 0 && !flashcardAtual) {
      setFlashcardAtual(flashcardsParaRevisar[0]);
      setIndiceAtual(0);
    }
  }, [flashcardsParaRevisar, flashcardAtual]);
  const proximoFlashcard = () => {
    if (indiceAtual < flashcardsParaRevisar.length - 1) {
      const novoIndice = indiceAtual + 1;
      setIndiceAtual(novoIndice);
      setFlashcardAtual(flashcardsParaRevisar[novoIndice]);
      setMostrarVerso(false);
    } else {
      setModoRevisao(false);
      setFlashcardAtual(null);
      setIndiceAtual(0);
      setMostrarVerso(false);
      toast.success("Parabéns! Você revisou todos os flashcards disponíveis!");
    }
  };
  const avaliarQualidade = async (qualidade: number) => {
    if (!flashcardAtual) return;
    try {
      await revisarFlashcard(flashcardAtual.id, qualidade);
      toast.success("Revisão registrada!");
      proximoFlashcard();
    } catch (err) {
      toast.error("Erro ao registrar revisão");
      console.error(err);
    }
  };
  const iniciarRevisao = () => {
    if (flashcardsParaRevisar.length === 0) {
      toast.info("Nenhum flashcard precisa ser revisado no momento!");
      return;
    }
    setModoRevisao(true);
    setFlashcardAtual(flashcardsParaRevisar[0]);
    setIndiceAtual(0);
    setMostrarVerso(false);
  };
  const handleGerarFlashcards = async () => {
    if (!disciplinaGerar) {
      toast.error("Selecione uma disciplina");
      return;
    }
    try {
      toast.loading("Gerando flashcards com IA...");
      await gerarFlashcards(disciplinaGerar, quantidadeGerar);
      toast.success(`${quantidadeGerar} flashcards gerados com sucesso!`);
      setOpenGerar(false);
      setDisciplinaGerar("");
      setQuantidadeGerar(5);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar flashcards");
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Brain className="size-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando flashcards...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Erro: {error}</p>
            <Button onClick={refetch} className="mt-4">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="size-8 text-primary" />
              Revisão de Flashcards
            </h1>
            <p className="text-muted-foreground mt-2">
              Sistema de repetição espaçada para melhorar sua memória
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpenGerar(true)}>
              <Sparkles className="size-4 mr-2" />
              Gerar com IA
            </Button>
            <Button onClick={() => setOpenCriar(true)}>
              <Plus className="size-4 mr-2" />
              Criar Flashcard
            </Button>
          </div>
        </div>
        {}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{flashcards.length}</div>
              <div className="text-sm text-muted-foreground">
                Total de Flashcards
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-500">
                {flashcardsParaRevisar.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Para Revisar Agora
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-500">
                {flashcards.length - flashcardsParaRevisar.length}
              </div>
              <div className="text-sm text-muted-foreground">Em Dia</div>
            </CardContent>
          </Card>
        </div>
      </div>
      {}
      {modoRevisao && flashcardAtual ? (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Flashcard {indiceAtual + 1} de {flashcardsParaRevisar.length}
              </CardTitle>
              {flashcardAtual.disciplinas && (
                <span className="text-sm text-muted-foreground">
                  {flashcardAtual.disciplinas.nome}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {}
            <div className="mb-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Pergunta
              </div>
              <div className="p-6 bg-muted rounded-lg text-lg min-h-[120px] flex items-center justify-center">
                {flashcardAtual.frente}
              </div>
            </div>
            {}
            {mostrarVerso && (
              <div className="mb-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Resposta
                </div>
                <div className="p-6 bg-primary/5 border-2 border-primary/20 rounded-lg text-lg min-h-[120px] flex items-center justify-center">
                  {flashcardAtual.verso}
                </div>
              </div>
            )}
            {}
            <div className="flex flex-col gap-3">
              {!mostrarVerso ? (
                <Button
                  size="lg"
                  onClick={() => setMostrarVerso(true)}
                  className="w-full"
                >
                  <Eye className="size-4 mr-2" />
                  Mostrar Resposta
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-center text-muted-foreground mb-4">
                    Como você se saiu?
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => avaliarQualidade(0)}
                      className="h-auto py-4 flex-col"
                    >
                      <XCircle className="size-5 mb-1" />
                      <span className="text-xs">Esqueci</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => avaliarQualidade(2)}
                      className="h-auto py-4 flex-col"
                    >
                      <span className="text-xs">Difícil</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => avaliarQualidade(3)}
                      className="h-auto py-4 flex-col"
                    >
                      <span className="text-xs">Bom</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => avaliarQualidade(4)}
                      className="h-auto py-4 flex-col"
                    >
                      <span className="text-xs">Fácil</span>
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => avaliarQualidade(5)}
                      className="h-auto py-4 flex-col col-span-2 md:col-span-1"
                    >
                      <CheckCircle2 className="size-5 mb-1" />
                      <span className="text-xs">Perfeito</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Lista de todos os flashcards */}
          {flashcards.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Todos os Flashcards ({flashcards.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {flashcards.map((fc) => (
                  <Card
                    key={fc.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setFlashcardPreview(fc);
                      setOpenPreview(true);
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base line-clamp-2">
                          {fc.frente}
                        </CardTitle>
                        {fc.gerado_por_ia && (
                          <Sparkles className="size-4 text-primary flex-shrink-0 ml-2" />
                        )}
                      </div>
                      {fc.disciplinas && (
                        <p className="text-xs text-muted-foreground">
                          {fc.disciplinas.nome}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {fc.verso}
                      </p>
                      {fc.revisao && (
                        <div className="text-xs text-muted-foreground">
                          Próxima revisão:{" "}
                          {new Date(
                            fc.revisao.proxima_revisao
                          ).toLocaleDateString("pt-BR")}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Botão para iniciar revisão */}
          {flashcardsParaRevisar.length > 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Brain className="size-16 mx-auto mb-4 text-primary" />
                <h2 className="text-2xl font-bold mb-2">
                  Pronto para revisar?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Você tem {flashcardsParaRevisar.length} flashcard
                  {flashcardsParaRevisar.length !== 1 ? "s" : ""} aguardando
                  revisão
                </p>
                <Button size="lg" onClick={iniciarRevisao}>
                  <RotateCcw className="size-4 mr-2" />
                  Iniciar Revisão
                </Button>
              </CardContent>
            </Card>
          ) : flashcards.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="size-16 mx-auto mb-4 text-green-500" />
                <h2 className="text-2xl font-bold mb-2">Tudo em dia! 🎉</h2>
                <p className="text-muted-foreground mb-6">
                  Não há flashcards para revisar no momento. Crie novos ou
                  aguarde a próxima revisão programada.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => setOpenCriar(true)}>
                    <Plus className="size-4 mr-2" />
                    Criar Flashcard
                  </Button>
                  <Button variant="outline" onClick={() => setOpenGerar(true)}>
                    <Sparkles className="size-4 mr-2" />
                    Gerar com IA
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="size-16 mx-auto mb-4 text-green-500" />
                <h2 className="text-2xl font-bold mb-2">Tudo em dia! 🎉</h2>
                <p className="text-muted-foreground mb-6">
                  Todos os seus flashcards estão em dia. Nenhum precisa ser
                  revisado agora.
                </p>
                <Button size="lg" onClick={iniciarRevisao} variant="outline">
                  <RotateCcw className="size-4 mr-2" />
                  Revisar Todos Mesmo Assim
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      {}
      <Dialog open={openCriar} onOpenChange={setOpenCriar}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Flashcard</DialogTitle>
            <DialogDescription>
              Crie um flashcard personalizado para revisão
            </DialogDescription>
          </DialogHeader>
          <CriarFlashcardForm
            disciplinas={disciplinas}
            onClose={() => setOpenCriar(false)}
            onCreate={async () => {
              await refetch();
              setOpenCriar(false);
            }}
          />
        </DialogContent>
      </Dialog>
      {}
      <Dialog open={openGerar} onOpenChange={setOpenGerar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Flashcards com IA</DialogTitle>
            <DialogDescription>
              Gere flashcards automaticamente a partir das suas anotações
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="disciplina" className="text-sm font-medium">
                Disciplina
              </label>
              <select
                id="disciplina"
                value={disciplinaGerar}
                onChange={(e) => setDisciplinaGerar(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              >
                <option value="">Selecione uma disciplina</option>
                {disciplinas.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="quantidade" className="text-sm font-medium">
                Quantidade
              </label>
              <Input
                id="quantidade"
                type="number"
                min="1"
                max="20"
                value={quantidadeGerar}
                onChange={(e) =>
                  setQuantidadeGerar(parseInt(e.target.value) || 5)
                }
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenGerar(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGerarFlashcards}>
              <Sparkles className="size-4 mr-2" />
              Gerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Preview do Flashcard */}
      <Dialog open={openPreview} onOpenChange={setOpenPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="size-5" />
                Prévia do Flashcard
              </DialogTitle>
              {flashcardPreview?.gerado_por_ia && (
                <div className="flex items-center gap-1 text-xs text-primary">
                  <Sparkles className="size-3" />
                  Gerado por IA
                </div>
              )}
            </div>
            {flashcardPreview?.disciplinas && (
              <DialogDescription>
                Disciplina: {flashcardPreview.disciplinas.nome}
              </DialogDescription>
            )}
          </DialogHeader>
          {flashcardPreview && (
            <div className="space-y-6 py-4">
              {/* Frente */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Eye className="size-4" />
                  Pergunta / Frente
                </div>
                <div className="p-6 bg-muted rounded-lg text-lg min-h-[120px] flex items-center">
                  <p className="w-full">{flashcardPreview.frente}</p>
                </div>
              </div>

              {/* Verso */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <EyeOff className="size-4" />
                  Resposta / Verso
                </div>
                <div className="p-6 bg-primary/5 border-2 border-primary/20 rounded-lg text-lg min-h-[120px] flex items-center">
                  <p className="w-full">{flashcardPreview.verso}</p>
                </div>
              </div>

              {/* Informações adicionais */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Dificuldade
                  </p>
                  <p className="text-sm font-medium">
                    {flashcardPreview.dificuldade === 0
                      ? "Fácil"
                      : flashcardPreview.dificuldade === 1
                      ? "Médio"
                      : "Difícil"}
                  </p>
                </div>
                {flashcardPreview.revisao && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Próxima Revisão
                    </p>
                    <p className="text-sm font-medium">
                      {new Date(
                        flashcardPreview.revisao.proxima_revisao
                      ).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
                {flashcardPreview.tags && flashcardPreview.tags.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {flashcardPreview.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-muted rounded-md text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenPreview(false)}>
              Fechar
            </Button>
            {flashcardPreview && (
              <Button
                onClick={() => {
                  setOpenPreview(false);
                  setFlashcardAtual(flashcardPreview);
                  setModoRevisao(true);
                  setIndiceAtual(
                    flashcardsParaRevisar.findIndex(
                      (fc) => fc.id === flashcardPreview.id
                    ) || 0
                  );
                  setMostrarVerso(false);
                }}
              >
                <RotateCcw className="size-4 mr-2" />
                Revisar Este Flashcard
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function CriarFlashcardForm({
  disciplinas,
  onClose,
  onCreate,
}: {
  disciplinas: Array<{ id: string; nome: string }>;
  onClose: () => void;
  onCreate: () => void;
}) {
  const [frente, setFrente] = useState("");
  const [verso, setVerso] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [loading, setLoading] = useState(false);
  const { createFlashcard } = useFlashcards();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frente || !verso) {
      toast.error("Preencha frente e verso do flashcard");
      return;
    }
    setLoading(true);
    try {
      await createFlashcard(frente, verso, disciplinaId || undefined, [], 1);
      toast.success("Flashcard criado com sucesso!");
      setFrente("");
      setVerso("");
      setDisciplinaId("");
      onCreate();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar flashcard");
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="disciplina-select" className="text-sm font-medium">
          Disciplina (opcional)
        </label>
        <select
          id="disciplina-select"
          value={disciplinaId}
          onChange={(e) => setDisciplinaId(e.target.value)}
          className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
        >
          <option value="">Nenhuma</option>
          {disciplinas.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="frente" className="text-sm font-medium">
          Pergunta / Frente
        </label>
        <textarea
          id="frente"
          value={frente}
          onChange={(e) => setFrente(e.target.value)}
          placeholder="Digite a pergunta ou frente do flashcard..."
          className="w-full mt-1 min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          required
        />
      </div>
      <div>
        <label htmlFor="verso" className="text-sm font-medium">
          Resposta / Verso
        </label>
        <textarea
          id="verso"
          value={verso}
          onChange={(e) => setVerso(e.target.value)}
          placeholder="Digite a resposta ou verso do flashcard..."
          className="w-full mt-1 min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          required
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar Flashcard"}
        </Button>
      </DialogFooter>
    </form>
  );
}
