"use client";
import { useState, useEffect } from "react";
import {
  User,
  Mail,
  GraduationCap,
  Hash,
  Phone,
  Camera,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  Edit2,
  Calendar,
  Upload,
  Link as LinkIcon,
  X,
  Image as ImageIcon,
  Shield,
  ShieldCheck,
  ShieldOff,
  QrCode,
  Key,
  BookOpen,
  TrendingUp,
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  Chrome,
  Github,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
interface ProfileData {
  id: string;
  email: string;
  nome: string;
  avatar_url: string;
  bio: string;
  curso: string;
  periodo: string;
  matricula: string;
  telefone: string;
  created_at?: string;
  updated_at?: string;
  perfil_publico?: boolean;
}

interface ProfileStats {
  totalDisciplinas: number;
  proximasAvaliacoes: Array<{
    id: string;
    tipo: string;
    data_iso: string;
    disciplinas: { nome: string } | null;
  }>;
  totalProximas: number;
  progressoGeral: number | null;
}
export default function PerfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarMethod, setAvatarMethod] = useState<"upload" | "url">("upload");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaVerificationCode, setMfaVerificationCode] = useState("");
  const [mfaVerifying, setMfaVerifying] = useState(false);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [perfilPublico, setPerfilPublico] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] =
    useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [profile, setProfile] = useState<ProfileData>({
    id: "",
    email: "",
    nome: "",
    avatar_url: "",
    bio: "",
    curso: "",
    periodo: "",
    matricula: "",
    telefone: "",
    perfil_publico: false,
  });
  const [formData, setFormData] = useState<ProfileData>({
    id: "",
    email: "",
    nome: "",
    avatar_url: "",
    bio: "",
    curso: "",
    periodo: "",
    matricula: "",
    telefone: "",
    perfil_publico: false,
  });
  useEffect(() => {
    loadProfile();
    loadMfaStatus();
    loadStats();
  }, []);

  useEffect(() => {
    if (newPassword) {
      calculatePasswordStrength(newPassword);
    } else {
      setPasswordStrength(0);
    }
  }, [newPassword]);

  const loadMfaStatus = async () => {
    try {
      const response = await fetch("/api/auth/mfa/status");
      if (response.ok) {
        const data = await response.json();
        setMfaEnabled(data.enabled);
        if (data.factor) {
          setMfaFactorId(data.factor.id);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar status do 2FA:", error);
    }
  };

  const handleEnableMfa = async () => {
    try {
      setMfaLoading(true);
      const response = await fetch("/api/auth/mfa/enroll", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setMfaQrCode(data.qr_code);
        setMfaSecret(data.secret);
        setMfaFactorId(data.id);
        setShowMfaSetup(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Erro ao ativar 2FA");
      }
    } catch (error) {
      console.error("Erro ao ativar 2FA:", error);
      setError("Erro ao ativar autenticação de dois fatores");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    if (!mfaFactorId || !mfaVerificationCode.trim()) {
      setError("Digite o código de verificação");
      return;
    }

    try {
      setMfaVerifying(true);
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          factorId: mfaFactorId,
          code: mfaVerificationCode.trim(),
        }),
      });

      if (response.ok) {
        setMfaEnabled(true);
        setShowMfaSetup(false);
        setMfaQrCode(null);
        setMfaSecret(null);
        setMfaVerificationCode("");
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Código inválido");
      }
    } catch (error) {
      console.error("Erro ao verificar código 2FA:", error);
      setError("Erro ao verificar código");
    } finally {
      setMfaVerifying(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!mfaFactorId) {
      setError("ID do fator não encontrado");
      return;
    }

    if (
      !confirm(
        "Tem certeza que deseja desativar a autenticação de dois fatores? Sua conta ficará menos segura."
      )
    ) {
      return;
    }

    try {
      setMfaLoading(true);
      const response = await fetch("/api/auth/mfa/unenroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factorId: mfaFactorId }),
      });

      if (response.ok) {
        setMfaEnabled(false);
        setMfaFactorId(null);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Erro ao desativar 2FA");
      }
    } catch (error) {
      console.error("Erro ao desativar 2FA:", error);
      setError("Erro ao desativar autenticação de dois fatores");
    } finally {
      setMfaLoading(false);
    }
  };
  const loadProfile = async () => {
    try {
      setLoading(true);
      const supabase = createSupabaseBrowser();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push("/");
        return;
      }
      const response = await fetch("/api/profile");
      if (!response.ok) {
        throw new Error("Erro ao carregar perfil");
      }
      const { profile: profileData } = await response.json();
      setProfile(profileData);
      setFormData(profileData);
      setPerfilPublico(profileData.perfil_publico || false);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const response = await fetch("/api/profile/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Erro ao carregar estatísticas:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return { label: "", color: "" };
    if (passwordStrength <= 2) return { label: "Fraca", color: "text-red-500" };
    if (passwordStrength === 3)
      return { label: "Média", color: "text-yellow-500" };
    if (passwordStrength === 4)
      return { label: "Forte", color: "text-green-500" };
    return { label: "Muito Forte", color: "text-green-600" };
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Preencha todos os campos");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (passwordStrength < 3) {
      setError(
        "A senha é muito fraca. Use pelo menos 8 caracteres com letras maiúsculas, minúsculas e números."
      );
      return;
    }

    try {
      setChangingPassword(true);
      setError(null);
      const supabase = createSupabaseBrowser();

      // Verificar senha atual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: currentPassword,
      });

      if (signInError) {
        setError("Senha atual incorreta");
        return;
      }

      // Atualizar senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message || "Erro ao alterar senha");
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePassword(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao alterar senha");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSavePrivacy = async () => {
    try {
      setSavingPrivacy(true);
      setError(null);
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          perfil_publico: perfilPublico,
        }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Erro ao salvar preferências");
      }

      setProfile((prev) => ({ ...prev, perfil_publico: perfilPublico }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar preferências");
    } finally {
      setSavingPrivacy(false);
    }
  };

  // Verificar se há alterações não salvas
  const hasUnsavedChanges = () => {
    if (!isEditing) return false;
    return (
      formData.nome !== profile.nome ||
      formData.bio !== profile.bio ||
      formData.curso !== profile.curso ||
      formData.periodo !== profile.periodo ||
      formData.matricula !== profile.matricula ||
      formData.telefone !== profile.telefone ||
      formData.avatar_url !== profile.avatar_url
    );
  };

  // Função para lidar com ações que podem descartar alterações
  const handleActionWithUnsavedCheck = (action: () => void) => {
    if (hasUnsavedChanges()) {
      setPendingAction(() => action);
      setShowUnsavedChangesDialog(true);
    } else {
      action();
    }
  };

  // Confirmar descartar alterações
  const confirmDiscardChanges = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setShowUnsavedChangesDialog(false);
    setFormData(profile);
    setIsEditing(false);
    setError(null);
    setSuccess(false);
  };

  // Cancelar descartar alterações
  const cancelDiscardChanges = () => {
    setShowUnsavedChangesDialog(false);
    setPendingAction(null);
  };
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: formData.nome,
          bio: formData.bio,
          curso: formData.curso,
          periodo: formData.periodo,
          matricula: formData.matricula,
          telefone: formData.telefone,
          avatar_url: formData.avatar_url,
        }),
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Erro ao salvar perfil");
      }
      const { profile: updatedProfile } = await response.json();
      setProfile(updatedProfile);
      setFormData(updatedProfile);
      setIsEditing(false);
      setSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };
  const getInitials = (nome: string, email: string) => {
    if (nome) {
      const parts = nome.trim().split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return nome.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "U";
  };
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          <User className="h-8 w-8" />
          Meu Perfil
        </h1>
            <p className="text-zinc-500 mt-2">
              Gerencie suas informações pessoais
            </p>
          </div>
          {profile.perfil_publico && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30">
              <Eye className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                Público
              </span>
            </div>
          )}
        </div>
      </header>
      {}
      {error && (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <XCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/10 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <p className="text-sm text-green-600 dark:text-green-400">
            Perfil atualizado com sucesso!
          </p>
        </div>
      )}
      {}
      {/* Cards de Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total de Disciplinas
                  </p>
                  <p className="text-3xl font-bold">{stats.totalDisciplinas}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Próximas Avaliações
                  </p>
                  <p className="text-3xl font-bold">{stats.totalProximas}</p>
                  {stats.proximasAvaliacoes.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(
                        stats.proximasAvaliacoes[0].data_iso
                      ).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Progresso Geral
                  </p>
                  <p className="text-3xl font-bold">
                    {stats.progressoGeral !== null
                      ? stats.progressoGeral.toFixed(1)
                      : "—"}
                  </p>
                  {stats.progressoGeral !== null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Média ponderada
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {}
      <Card className="animate-in fade-in slide-in-from-bottom-6 duration-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Suas informações de perfil e contato
              </CardDescription>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={formData.avatar_url} alt={formData.nome} />
                <AvatarFallback>
                  {getInitials(formData.nome, formData.email)}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="absolute bottom-0 right-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => {
                      setShowAvatarModal(true);
                      setAvatarMethod("upload");
                      setAvatarFile(null);
                      setAvatarUrl("");
                      setAvatarPreview(null);
                    }}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <Input
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Seu nome completo"
                  className="text-lg font-semibold"
                />
              ) : (
                <h2 className="text-2xl font-semibold">
                  {formData.nome || "Sem nome"}
                </h2>
              )}
              <p className="text-sm text-zinc-500 mt-1 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {formData.email}
              </p>
            </div>
          </div>
          <Separator />
          {}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Sobre você
            </label>
            {isEditing ? (
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Conte um pouco sobre você..."
                className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            ) : (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {formData.bio || "Nenhuma biografia adicionada ainda."}
              </p>
            )}
          </div>
          <Separator />
          {}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Curso
              </label>
              {isEditing ? (
                <Input
                  name="curso"
                  value={formData.curso}
                  onChange={handleInputChange}
                  placeholder="Ex: Engenharia de Software"
                />
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {formData.curso || "Não informado"}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Período
              </label>
              {isEditing ? (
                <Input
                  name="periodo"
                  value={formData.periodo}
                  onChange={handleInputChange}
                  placeholder="Ex: 8"
                  type="number"
                  min="1"
                  max="20"
                />
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {formData.periodo
                    ? `${formData.periodo}º período`
                    : "Não informado"}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Matrícula
              </label>
              {isEditing ? (
                <Input
                  name="matricula"
                  value={formData.matricula}
                  onChange={handleInputChange}
                  placeholder="Ex: 20201234567"
                />
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {formData.matricula || "Não informado"}
                </p>
              )}
            </div>
          </div>
          <Separator />
          {}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefone
            </label>
            {isEditing ? (
              <Input
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                placeholder="Ex: (92) 99999-9999"
                type="tel"
              />
            ) : (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {formData.telefone || "Não informado"}
              </p>
            )}
          </div>
          {}
          {isEditing && (
            <div className="flex flex-col gap-3 pt-4">
              {hasUnsavedChanges() && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs text-yellow-600 dark:text-yellow-400">
                    Você tem alterações não salvas
                  </span>
                </div>
              )}
              <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                  onClick={() =>
                    handleActionWithUnsavedCheck(() => {
                  setFormData(profile);
                  setIsEditing(false);
                  setError(null);
                  setSuccess(false);
                    })
                  }
                disabled={saving}
              >
                Cancelar
              </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {}
      <Card className="animate-in fade-in slide-in-from-bottom-14 duration-700">
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
          <CardDescription>Dados da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <div className="text-sm font-medium">Email</div>
              <div className="text-sm text-zinc-500">{profile.email}</div>
            </div>
            <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-500 border border-blue-500/30">
              Verificado
            </span>
          </div>
          {profile.created_at && (
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="text-sm font-medium">Membro desde</div>
                <div className="text-sm text-zinc-500">
                  {new Date(profile.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alterar Senha */}
      <Card className="animate-in fade-in slide-in-from-bottom-8 duration-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Atualize sua senha para manter sua conta segura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showChangePassword ? (
            <Button
              variant="outline"
              onClick={() => setShowChangePassword(true)}
              className="w-full"
            >
              <Key className="h-4 w-4 mr-2" />
              Alterar Senha
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Senha Atual
                </label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Nova Senha
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                />
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            passwordStrength <= 2
                              ? "bg-red-500"
                              : passwordStrength === 3
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          getPasswordStrengthLabel().color
                        }`}
                      >
                        {getPasswordStrengthLabel().label}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p
                        className={
                          newPassword.length >= 8 ? "text-green-600" : ""
                        }
                      >
                        {newPassword.length >= 8 ? "✓" : "○"} Mínimo 8
                        caracteres
                      </p>
                      <p
                        className={
                          /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)
                            ? "text-green-600"
                            : ""
                        }
                      >
                        {/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)
                          ? "✓"
                          : "○"}{" "}
                        Letras maiúsculas e minúsculas
                      </p>
                      <p
                        className={
                          /\d/.test(newPassword) ? "text-green-600" : ""
                        }
                      >
                        {/\d/.test(newPassword) ? "✓" : "○"} Pelo menos um
                        número
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Confirmar Nova Senha
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua nova senha"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    As senhas não coincidem
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowChangePassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setError(null);
                  }}
                  className="flex-1"
                  disabled={changingPassword}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleChangePassword}
                  disabled={
                    changingPassword ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword
                  }
                  className="flex-1"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Senha
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferências de Privacidade */}
      <Card className="animate-in fade-in slide-in-from-bottom-10 duration-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {perfilPublico ? (
              <Eye className="h-5 w-5" />
            ) : (
              <EyeOff className="h-5 w-5" />
            )}
            Privacidade do Perfil
          </CardTitle>
          <CardDescription>
            Controle quem pode ver suas informações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="flex-1">
              <p className="font-medium">Perfil Público</p>
              <p className="text-sm text-muted-foreground">
                {perfilPublico
                  ? "Outros usuários podem ver seu perfil e estatísticas"
                  : "Seu perfil é privado e apenas você pode vê-lo"}
              </p>
            </div>
            <Button
              variant={perfilPublico ? "default" : "outline"}
              onClick={() => setPerfilPublico(!perfilPublico)}
              disabled={savingPrivacy}
            >
              {perfilPublico ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Público
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Privado
                </>
              )}
            </Button>
          </div>
          <Button
            onClick={handleSavePrivacy}
            disabled={
              savingPrivacy ||
              perfilPublico === (profile.perfil_publico || false)
            }
            className="w-full"
          >
            {savingPrivacy ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Preferências
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="animate-in fade-in slide-in-from-bottom-12 duration-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança da Conta
              </CardTitle>
              <CardDescription>
                Autenticação de dois fatores (2FA) para maior segurança
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              {mfaEnabled ? (
                <ShieldCheck className="h-5 w-5 text-green-500" />
              ) : (
                <ShieldOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Autenticação de Dois Fatores</p>
                <p className="text-sm text-muted-foreground">
                  {mfaEnabled
                    ? "2FA está ativado. Sua conta está mais segura."
                    : "Adicione uma camada extra de segurança à sua conta."}
                </p>
              </div>
            </div>
            {mfaEnabled ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDisableMfa}
                disabled={mfaLoading}
              >
                {mfaLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Desativando...
                  </>
                ) : (
                  <>
                    <ShieldOff className="h-4 w-4 mr-2" />
                    Desativar 2FA
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleEnableMfa}
                disabled={mfaLoading}
              >
                {mfaLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Ativar 2FA
                  </>
                )}
              </Button>
            )}
          </div>

          {showMfaSetup && mfaQrCode && (
            <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  Configure seu aplicativo autenticador
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Escaneie o QR code com um aplicativo autenticador como Google
                  Authenticator, Authy ou Microsoft Authenticator.
                </p>
                <div className="flex justify-center p-4 bg-white rounded-lg border">
                  <img
                    src={mfaQrCode}
                    alt="QR Code para 2FA"
                    className="w-48 h-48"
                  />
                </div>
                {mfaSecret && (
                  <div className="mt-4 p-3 rounded-lg bg-muted border">
                    <p className="text-xs text-muted-foreground mb-2">
                      Ou digite manualmente:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm font-mono bg-background px-3 py-2 rounded border">
                        {mfaSecret}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(mfaSecret);
                          setSuccess(true);
                          setTimeout(() => setSuccess(false), 2000);
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Digite o código de verificação
                </label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={mfaVerificationCode}
                  onChange={(e) => {
                    setMfaVerificationCode(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    );
                    setError(null);
                  }}
                  maxLength={6}
                  className="text-center text-lg font-mono tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  Digite o código de 6 dígitos do seu aplicativo autenticador
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowMfaSetup(false);
                    setMfaQrCode(null);
                    setMfaSecret(null);
                    setMfaVerificationCode("");
                    setMfaFactorId(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleVerifyMfa}
                  disabled={mfaVerifying || mfaVerificationCode.length !== 6}
                >
                  {mfaVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verificar e Ativar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* OAuth Providers Section */}
          <Separator />
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Login Social</h3>
              <p className="text-sm text-muted-foreground">
                Conecte suas contas sociais para login rápido e seguro
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  window.location.href = "/api/auth/oauth?provider=google";
                }}
              >
                <Chrome className="h-4 w-4 mr-2" />
                Google
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  window.location.href = "/api/auth/oauth?provider=github";
                }}
              >
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {}
      <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Foto de Perfil</DialogTitle>
            <DialogDescription>
              Escolha uma imagem do seu dispositivo ou cole uma URL
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {}
            <div className="flex gap-2 border-b">
              <button
                type="button"
                onClick={() => {
                  setAvatarMethod("upload");
                  setAvatarFile(null);
                  setAvatarPreview(null);
                  setError(null);
                }}
                className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                  avatarMethod === "upload"
                    ? "border-b-2 border-primary text-primary"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                <Upload className="h-4 w-4 inline mr-2" />
                Upload
              </button>
              <button
                type="button"
                onClick={() => {
                  setAvatarMethod("url");
                  setAvatarFile(null);
                  setAvatarPreview(null);
                  setError(null);
                }}
                className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                  avatarMethod === "url"
                    ? "border-b-2 border-primary text-primary"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                <LinkIcon className="h-4 w-4 inline mr-2" />
                URL
              </button>
            </div>
            {}
            {avatarMethod === "upload" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="avatar-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-zinc-400" />
                      <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
                        <span className="font-semibold">
                          Clique para fazer upload
                        </span>{" "}
                        ou arraste e solte
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        PNG, SVG ou JPG (MAX. 5MB)
                      </p>
                    </div>
                    <input
                      id="avatar-upload"
                      type="file"
                      className="hidden"
                      accept="image/png,image/svg+xml,image/jpeg,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            setError("Arquivo muito grande. Máximo de 5MB.");
                            return;
                          }
                          const validTypes = [
                            "image/png",
                            "image/svg+xml",
                            "image/jpeg",
                            "image/jpg",
                          ];
                          if (!validTypes.includes(file.type)) {
                            setError("Formato inválido. Use PNG, SVG ou JPG.");
                            return;
                          }
                          setAvatarFile(file);
                          setError(null);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setAvatarPreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {avatarFile && (
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Arquivo selecionado: {avatarFile.name}
                    </p>
                    {avatarPreview && (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                        <img
                          src={avatarPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {}
            {avatarMethod === "url" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="avatar-url" className="text-sm font-medium">
                    URL da Imagem
                  </label>
                  <Input
                    id="avatar-url"
                    type="url"
                    placeholder="https://exemplo.com/foto.jpg"
                    value={avatarUrl}
                    onChange={(e) => {
                      setAvatarUrl(e.target.value);
                      setError(null);
                      if (e.target.value) {
                        const img = new Image();
                        img.onload = () => {
                          setAvatarPreview(e.target.value);
                        };
                        img.onerror = () => {
                          setAvatarPreview(null);
                        };
                        img.src = e.target.value;
                      } else {
                        setAvatarPreview(null);
                      }
                    }}
                  />
                  <p className="text-xs text-zinc-500">
                    Cole a URL completa da imagem (PNG, SVG ou JPG)
                  </p>
                </div>
                {avatarPreview && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => {
                        setAvatarPreview(null);
                        setError(
                          "Não foi possível carregar a imagem desta URL."
                        );
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            {}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            {}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAvatarModal(false);
                  setAvatarFile(null);
                  setAvatarUrl("");
                  setAvatarPreview(null);
                  setError(null);
                }}
                disabled={uploadingAvatar}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  setUploadingAvatar(true);
                  setError(null);
                  try {
                    let finalUrl = "";
                    if (avatarMethod === "upload" && avatarFile) {
                      const reader = new FileReader();
                      finalUrl = await new Promise<string>(
                        (resolve, reject) => {
                          reader.onloadend = () => {
                            resolve(reader.result as string);
                          };
                          reader.onerror = reject;
                          reader.readAsDataURL(avatarFile);
                        }
                      );
                    } else if (avatarMethod === "url" && avatarUrl) {
                      try {
                        new URL(avatarUrl);
                        finalUrl = avatarUrl;
                      } catch {
                        setError("URL inválida");
                        setUploadingAvatar(false);
                        return;
                      }
                    } else {
                      setError(
                        avatarMethod === "upload"
                          ? "Selecione um arquivo"
                          : "Digite uma URL"
                      );
                      setUploadingAvatar(false);
                      return;
                    }
                    setFormData((prev) => ({ ...prev, avatar_url: finalUrl }));
                    setShowAvatarModal(false);
                    setAvatarFile(null);
                    setAvatarUrl("");
                    setAvatarPreview(null);
                    setError(null);
                  } catch (err: any) {
                    setError(err.message || "Erro ao processar imagem");
                  } finally {
                    setUploadingAvatar(false);
                  }
                }}
                disabled={uploadingAvatar || (!avatarFile && !avatarUrl)}
                className="flex-1"
              >
                {uploadingAvatar ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Aplicar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para alterações não salvas */}
      <AlertDialog
        open={showUnsavedChangesDialog}
        onOpenChange={setShowUnsavedChangesDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Alterações Não Salvas
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas no seu perfil. Se você continuar,
              todas as alterações serão descartadas.
              <br />
              <span className="text-yellow-600 dark:text-yellow-400 font-medium mt-2 block">
                Deseja continuar mesmo assim?
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDiscardChanges}>
              Voltar e Salvar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDiscardChanges}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              Descartar Alterações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
