"use client";
import { useState, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Key,
  Chrome,
  Github,
  QrCode,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface MfaFactor {
  id: string;
  type: string;
  status: string;
  friendly_name?: string;
}

export function SecuritySettings() {
  const [mfaFactors, setMfaFactors] = useState<MfaFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadMfaFactors();
  }, []);

  const loadMfaFactors = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/mfa/factors");
      if (!response.ok) throw new Error("Erro ao carregar fatores MFA");

      const { totp } = await response.json();
      setMfaFactors(totp || []);
    } catch (error) {
      console.error("Erro ao carregar fatores MFA:", error);
      toast.error("Erro ao carregar configurações de segurança");
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollMfa = async () => {
    try {
      setEnrolling(true);
      const response = await fetch("/api/auth/mfa/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factorType: "totp" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar fator MFA");
      }

      const data = await response.json();
      setQrCode(data.qr_code || "");
      setSecret(data.secret || "");
      setShowEnrollDialog(true);
    } catch (error: any) {
      console.error("Erro ao criar fator MFA:", error);
      toast.error(error.message || "Erro ao ativar 2FA");
    } finally {
      setEnrolling(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      toast.error("Digite um código de 6 dígitos");
      return;
    }

    try {
      setVerifying(true);
      const factors = await fetch("/api/auth/mfa/factors").then((r) =>
        r.json()
      );
      const factorId = factors.totp?.[factors.totp.length - 1]?.id;

      if (!factorId) {
        throw new Error("Fator MFA não encontrado");
      }

      // Criar challenge
      const challengeResponse = await fetch("/api/auth/mfa/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factorId }),
      });

      if (!challengeResponse.ok) {
        throw new Error("Erro ao criar challenge");
      }

      const { id: challengeId } = await challengeResponse.json();

      // Verificar código
      const verifyResponse = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          factorId,
          challengeId,
          code: verificationCode,
        }),
      });

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json();
        throw new Error(error.error || "Código inválido");
      }

      toast.success("Autenticação de dois fatores ativada com sucesso!");
      setShowEnrollDialog(false);
      setVerificationCode("");
      setQrCode("");
      setSecret("");
      loadMfaFactors();
    } catch (error: any) {
      console.error("Erro ao verificar código:", error);
      toast.error(error.message || "Erro ao ativar 2FA");
    } finally {
      setVerifying(false);
    }
  };

  const handleRemoveMfa = async (factorId: string) => {
    if (
      !confirm("Tem certeza que deseja remover a autenticação de dois fatores?")
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/auth/mfa/factors?factorId=${factorId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao remover fator MFA");
      }

      toast.success("Autenticação de dois fatores removida");
      loadMfaFactors();
    } catch (error) {
      console.error("Erro ao remover fator MFA:", error);
      toast.error("Erro ao remover 2FA");
    }
  };

  const hasMfa = mfaFactors.length > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Segurança da Conta
          </CardTitle>
          <CardDescription>
            Gerencie autenticação de dois fatores e métodos de login
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 2FA Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  {hasMfa ? (
                    <>
                      <ShieldCheck className="h-5 w-5 text-green-500" />
                      Autenticação de Dois Fatores (2FA)
                    </>
                  ) : (
                    <>
                      <ShieldOff className="h-5 w-5 text-muted-foreground" />
                      Autenticação de Dois Fatores (2FA)
                    </>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasMfa
                    ? "2FA está ativado. Sua conta está mais segura."
                    : "Adicione uma camada extra de segurança à sua conta"}
                </p>
              </div>
              {hasMfa ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveMfa(mfaFactors[0].id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover 2FA
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleEnrollMfa}
                  disabled={enrolling}
                >
                  {enrolling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Configurando...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Ativar 2FA
                    </>
                  )}
                </Button>
              )}
            </div>

            {hasMfa && (
              <div className="rounded-md bg-green-500/10 border border-green-500/20 p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                      2FA Ativado
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                      Você precisará inserir um código do seu aplicativo
                      autenticador sempre que fizer login.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* OAuth Providers Section */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Login Social</h3>
              <p className="text-sm text-muted-foreground">
                Conecte suas contas sociais para login rápido
              </p>
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  window.location.href = "/api/auth/oauth?provider=google";
                }}
              >
                <Chrome className="h-4 w-4 mr-2" />
                Conectar com Google
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  window.location.href = "/api/auth/oauth?provider=github";
                }}
              >
                <Github className="h-4 w-4 mr-2" />
                Conectar com GitHub
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enroll MFA Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Autenticação de Dois Fatores</DialogTitle>
            <DialogDescription>
              Escaneie o QR code com seu aplicativo autenticador e digite o
              código gerado para confirmar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
              </div>
            )}
            {secret && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Ou digite este código manualmente:
                </p>
                <code className="text-sm font-mono bg-muted px-3 py-2 rounded">
                  {secret}
                </code>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Código de Verificação
              </label>
              <Input
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(
                    e.target.value.replace(/\D/g, "").slice(0, 6)
                  );
                }}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
              <p className="text-xs text-muted-foreground">
                Digite o código de 6 dígitos do seu aplicativo autenticador
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEnrollDialog(false);
                  setVerificationCode("");
                  setQrCode("");
                  setSecret("");
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleVerifyAndEnable}
                disabled={verifying || verificationCode.length !== 6}
                className="flex-1"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Confirmar e Ativar"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
