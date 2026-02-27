"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useDisciplinas, type Disciplina } from "@/hooks/useDisciplinas";
import {
  BookOpen,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

type TTipo = "obrigatoria" | "eletiva" | "optativa";
const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export function EditDisciplinaDialog({
  open,
  disciplina,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  disciplina: Disciplina | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const { updateDisciplina } = useDisciplinas();
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TTipo>("obrigatoria");
  const [horasSemana, setHorasSemana] = useState<number>(4);
  const [local, setLocal] = useState("");
  const [professor, setProfessor] = useState("");
  const [horarios, setHorarios] = useState<
    { dia: number; inicio: string; fim: string }[]
  >([]);
  const [novoHorario, setNovoHorario] = useState<{
    dia: number;
    inicio: string;
    fim: string;
  }>({ dia: 1, inicio: "08:00", fim: "10:00" });
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && disciplina) {
      setNome(disciplina.nome);
      setTipo(disciplina.tipo);
      setHorasSemana(disciplina.horasSemana ?? 4);
      setLocal(disciplina.local ?? "");
      setProfessor(disciplina.professor ?? "");
      setHorarios(
        (disciplina.horarios ?? []).map((h) => ({
          dia: h.dia,
          inicio: h.inicio,
          fim: h.fim,
        }))
      );
      setNovoHorario({ dia: 1, inicio: "08:00", fim: "10:00" });
      setStep(1);
    }
  }, [open, disciplina]);

  function adicionarHorario() {
    if (!novoHorario.inicio || !novoHorario.fim) {
      toast.error("Preencha o horário de início e fim");
      return;
    }
    if (novoHorario.inicio >= novoHorario.fim) {
      toast.error("O horário de fim deve ser depois do horário de início");
      return;
    }
    const conflito = horarios.some(
      (h) =>
        h.dia === novoHorario.dia &&
        ((novoHorario.inicio >= h.inicio && novoHorario.inicio < h.fim) ||
          (novoHorario.fim > h.inicio && novoHorario.fim <= h.fim) ||
          (novoHorario.inicio <= h.inicio && novoHorario.fim >= h.fim))
    );
    if (conflito) {
      toast.error("Já existe um horário neste dia e horário");
      return;
    }
    setHorarios((prev) => [...prev, { ...novoHorario }]);
    setNovoHorario({ dia: 1, inicio: "08:00", fim: "10:00" });
    toast.success("Horário adicionado");
  }
  function removerHorario(index: number) {
    setHorarios((prev) => prev.filter((_, i) => i !== index));
  }

  async function salvar() {
    if (!disciplina) return;
    if (!nome.trim()) {
      toast.error("Nome da disciplina é obrigatório");
      return;
    }
    if (horasSemana <= 0) {
      toast.error("Carga horária semanal deve ser maior que zero");
      return;
    }
    setSaving(true);
    const result = await updateDisciplina(disciplina.id, {
      nome: nome.trim(),
      tipo,
      horasSemana,
      local: local.trim() || undefined,
      professor: professor.trim() || undefined,
      horarios:
        horarios.length > 0
          ? horarios.map((h) => ({
              id: "",
              dia: h.dia,
              inicio: h.inicio,
              fim: h.fim,
            }))
          : [],
    });
    setSaving(false);
    if (result.success) {
      toast.success("Disciplina atualizada!");
      onOpenChange(false);
      onSaved();
    } else {
      toast.error(result.error || "Erro ao atualizar disciplina");
    }
  }

  if (!disciplina) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="flex items-center justify-center gap-1 px-6 pt-6 pb-2 border-b">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center">
              <button
                type="button"
                onClick={() => setStep(s)}
                className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : step > s
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </button>
              {s < 2 && <div className="w-8 h-0.5 bg-muted mx-0.5" />}
            </div>
          ))}
        </div>
        <div className="px-2 text-center text-xs text-muted-foreground mb-4 mt-2">
          {step === 1 && "Informações gerais"}
          {step === 2 && "Horários"}
        </div>

        <div className="px-6 pb-6">
          {step === 1 && (
            <div className="grid gap-6">
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                  Editar disciplina
                </DialogTitle>
                <DialogDescription>
                  Altere os dados abaixo. Campos marcados com * são
                  obrigatórios.
                </DialogDescription>
              </DialogHeader>

              <div>
                <Label
                  htmlFor="edit-nome"
                  className="flex items-center gap-2 block mb-4"
                >
                  Nome da Disciplina <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Programação Web, Cálculo I"
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-tipo" className="block mb-4">
                    Tipo <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={tipo}
                    onValueChange={(v) => setTipo(v as TTipo)}
                  >
                    <SelectTrigger id="edit-tipo" className="h-10">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      <SelectItem value="obrigatoria">Obrigatória</SelectItem>
                      <SelectItem value="eletiva">Eletiva</SelectItem>
                      <SelectItem value="optativa">Optativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-horasSemana" className="block mb-4">
                    Carga Horária Semanal (h){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-horasSemana"
                    type="number"
                    min={1}
                    max={40}
                    value={horasSemana}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value > 0 && value <= 40) setHorasSemana(value);
                    }}
                    placeholder="Ex: 4, 6, 8"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="edit-local"
                    className="flex items-center gap-2 block mb-4"
                  >
                    Local (opcional)
                  </Label>
                  <Input
                    id="edit-local"
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    placeholder="Ex: Sala 05, Lab Virtu"
                    className="h-10"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="edit-professor"
                    className="flex items-center gap-2 block mb-4"
                  >
                    Professor (opcional)
                  </Label>
                  <Input
                    id="edit-professor"
                    value={professor}
                    onChange={(e) => setProfessor(e.target.value)}
                    placeholder="Ex: Prof. João Silva"
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-6">
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  Horários das aulas
                </DialogTitle>
                <DialogDescription>
                  Adicione ou altere os horários da disciplina.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="grid gap-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Dia da Semana
                      </Label>
                      <Select
                        value={String(novoHorario.dia)}
                        onValueChange={(v) =>
                          setNovoHorario({ ...novoHorario, dia: Number(v) })
                        }
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                          {DIAS.map((dia, idx) => (
                            <SelectItem key={idx} value={String(idx)}>
                              {dia}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Início
                      </Label>
                      <Input
                        type="time"
                        value={novoHorario.inicio}
                        onChange={(e) =>
                          setNovoHorario({
                            ...novoHorario,
                            inicio: e.target.value,
                          })
                        }
                        className="h-10"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Fim
                      </Label>
                      <Input
                        type="time"
                        value={novoHorario.fim}
                        onChange={(e) =>
                          setNovoHorario({
                            ...novoHorario,
                            fim: e.target.value,
                          })
                        }
                        className="h-10"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={adicionarHorario}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                  {horarios.length > 0 && (
                    <div className="space-y-2 pt-3 border-t">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Horários adicionados ({horarios.length})
                      </Label>
                      <div className="space-y-2">
                        {horarios.map((h, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg border bg-background p-3 text-sm hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                {DIAS[h.dia].charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium">{DIAS[h.dia]}</div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                  {h.inicio} — {h.fim}
                                </div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                removerHorario(idx);
                                toast.success("Horário removido");
                              }}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Remover horário"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between items-center gap-4 p-4 border-t bg-muted/20">
          <div>
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            ) : (
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
            )}
          </div>
          <div>
            {step < 2 ? (
              <Button
                onClick={() => setStep(2)}
                disabled={!nome.trim() || horasSemana <= 0}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={salvar} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Salvar alterações
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
