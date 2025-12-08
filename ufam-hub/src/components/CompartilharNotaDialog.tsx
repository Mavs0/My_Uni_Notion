"use client";
import { useState } from "react";
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
import { Loader2, Copy, Check } from "lucide-react";

interface CompartilharNotaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notaId: string;
  disciplinaId?: string;
  tituloNota: string;
}

export function CompartilharNotaDialog({
  open,
  onOpenChange,
  notaId,
  disciplinaId,
  tituloNota,
}: CompartilharNotaDialogProps) {
  const [visibilidade, setVisibilidade] = useState<
    "publico" | "geral" | "privado"
  >("publico");
  const [emailPermitido, setEmailPermitido] = useState("");
  const [titulo, setTitulo] = useState(tituloNota);
  const [descricao, setDescricao] = useState("");
  const [permiteComentarios, setPermiteComentarios] = useState(true);
  const [permiteDownload, setPermiteDownload] = useState(true);
  const [loading, setLoading] = useState(false);
  const [linkCompartilhado, setLinkCompartilhado] = useState<string | null>(
    null
  );
  const [codigoAcesso, setCodigoAcesso] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCompartilhar = async () => {
    if (!titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (visibilidade === "geral" && !emailPermitido.trim()) {
      toast.error("Email é obrigatório para compartilhamento geral");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/colaboracao/compartilhar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nota_id: notaId,
          disciplina_id: disciplinaId,
          titulo: titulo.trim(),
          descricao: descricao.trim() || null,
          visibilidade,
          email_permitido:
            visibilidade === "geral" ? emailPermitido.trim() : null,
          permite_comentarios: permiteComentarios,
          permite_download: permiteDownload,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setLinkCompartilhado(data.link);
        setCodigoAcesso(data.codigo_acesso || null);
        toast.success("Nota compartilhada com sucesso!");
      } else {
        toast.error(data.error || "Erro ao compartilhar nota");
      }
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
      toast.error("Erro ao compartilhar nota");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (linkCompartilhado) {
      navigator.clipboard.writeText(linkCompartilhado);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setVisibilidade("publico");
      setEmailPermitido("");
      setTitulo(tituloNota);
      setDescricao("");
      setPermiteComentarios(true);
      setPermiteDownload(true);
      setLinkCompartilhado(null);
      setCodigoAcesso(null);
      setCopied(false);
    }, 300);
  };

  if (linkCompartilhado) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nota Compartilhada!</DialogTitle>
            <DialogDescription>
              Sua nota foi compartilhada com sucesso. Compartilhe o link abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Link de Compartilhamento</Label>
              <div className="flex gap-2">
                <Input value={linkCompartilhado} readOnly className="flex-1" />
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            {codigoAcesso && (
              <div className="space-y-2">
                <Label>Código de Acesso</Label>
                <div className="flex gap-2">
                  <Input
                    value={codigoAcesso}
                    readOnly
                    className="flex-1 text-center text-lg tracking-widest font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(codigoAcesso);
                      toast.success("Código copiado!");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Compartilhe este código com quem você deseja dar acesso à
                  nota.
                </p>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compartilhar Nota</DialogTitle>
          <DialogDescription>
            Configure as opções de compartilhamento da sua nota
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">
              Título <span className="text-red-500">*</span>
            </Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título da nota compartilhada"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição da nota compartilhada"
              className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibilidade">
              Visibilidade <span className="text-red-500">*</span>
            </Label>
            <Select
              value={visibilidade}
              onValueChange={(value: "publico" | "geral" | "privado") =>
                setVisibilidade(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="publico">
                  Público - Qualquer pessoa com o link
                </SelectItem>
                <SelectItem value="geral">
                  Geral - Apenas email específico
                </SelectItem>
                <SelectItem value="privado">
                  Privado - Requer código de acesso
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {visibilidade === "geral" && (
            <div className="space-y-2">
              <Label htmlFor="email">
                Email Permitido <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={emailPermitido}
                onChange={(e) => setEmailPermitido(e.target.value)}
                placeholder="email@exemplo.com"
              />
              <p className="text-sm text-muted-foreground">
                Apenas este email poderá acessar a nota compartilhada
              </p>
            </div>
          )}

          {visibilidade === "privado" && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Um código de acesso de 6 dígitos será gerado automaticamente.
                Compartilhe este código junto com o link para dar acesso à nota.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="permite_comentarios"
                checked={permiteComentarios}
                onChange={(e) => setPermiteComentarios(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="permite_comentarios" className="cursor-pointer">
                Permitir comentários
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="permite_download"
                checked={permiteDownload}
                onChange={(e) => setPermiteDownload(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="permite_download" className="cursor-pointer">
                Permitir download
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleCompartilhar} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Compartilhando...
                </>
              ) : (
                "Compartilhar"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
