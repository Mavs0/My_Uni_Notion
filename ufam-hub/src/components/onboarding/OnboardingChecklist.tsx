"use client";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2,
  Circle,
  BookOpen,
  User,
  Shield,
  Calendar,
  FileText,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  action?: () => void;
  checkFn: () => Promise<boolean> | boolean;
}

export function OnboardingChecklist() {
  const router = useRouter();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const checklistItems: ChecklistItem[] = [
    {
      id: "profile",
      title: "Completar Perfil",
      description: "Adicione suas informações pessoais e curso",
      icon: User,
      href: "/perfil",
      checkFn: async () => {
        const response = await fetch("/api/profile");
        if (!response.ok) return false;
        const { profile } = await response.json();
        return !!(profile.nome && profile.curso);
      },
    },
    {
      id: "disciplina",
      title: "Adicionar Primeira Disciplina",
      description: "Crie sua primeira disciplina para começar",
      icon: BookOpen,
      href: "/disciplinas",
      checkFn: async () => {
        const response = await fetch("/api/disciplinas");
        if (!response.ok) return false;
        const data = await response.json();
        return Array.isArray(data) && data.length > 0;
      },
    },
    {
      id: "security",
      title: "Configurar Segurança",
      description: "Ative 2FA e configure métodos de login",
      icon: Shield,
      href: "/perfil",
      checkFn: async () => {
        const response = await fetch("/api/auth/mfa/status");
        if (!response.ok) return false;
        const { enabled } = await response.json();
        return enabled === true;
      },
    },
    {
      id: "avaliacao",
      title: "Adicionar Primeira Avaliação",
      description: "Registre uma avaliação para acompanhar seu progresso",
      icon: Calendar,
      href: "/avaliacoes",
      checkFn: async () => {
        const response = await fetch("/api/avaliacoes");
        if (!response.ok) return false;
        const data = await response.json();
        return Array.isArray(data) && data.length > 0;
      },
    },
    {
      id: "nota",
      title: "Criar Primeira Anotação",
      description: "Comece a organizar seus estudos com anotações",
      icon: FileText,
      href: "/busca-anotacoes",
      checkFn: async () => {
        const response = await fetch("/api/notas");
        if (!response.ok) return false;
        const data = await response.json();
        return Array.isArray(data) && data.length > 0;
      },
    },
    {
      id: "chat",
      title: "Experimentar Chat IA",
      description: "Teste o assistente de IA para tirar dúvidas",
      icon: Sparkles,
      href: "/chat",
      checkFn: async () => {
        // Verificar se já usou o chat (pode ser verificado via histórico)
        return false; // Sempre false para incentivar o uso
      },
    },
  ];

  useEffect(() => {
    setItems(checklistItems);
    checkAllItems();
  }, []);

  const checkAllItems = async () => {
    setLoading(true);
    const checkedSet = new Set<string>();

    for (const item of checklistItems) {
      try {
        const isChecked = await item.checkFn();
        if (isChecked) {
          checkedSet.add(item.id);
        }
      } catch (error) {
        console.error(`Erro ao verificar ${item.id}:`, error);
      }
    }

    setChecked(checkedSet);
    setLoading(false);
  };

  const handleItemClick = (item: ChecklistItem) => {
    if (item.href) {
      router.push(item.href);
    }
    if (item.action) {
      item.action();
    }
  };

  const completedCount = checked.size;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Configuração Inicial</CardTitle>
            <CardDescription>
              Complete estas etapas para aproveitar ao máximo a plataforma
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkAllItems}
            disabled={loading}
          >
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Barra de progresso */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {completedCount} de {totalCount} concluídos
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Lista de itens */}
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            const isChecked = checked.has(item.id);

            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  isChecked
                    ? "bg-muted/50 border-green-500/30"
                    : "hover:bg-muted/30"
                }`}
                onClick={() => handleItemClick(item)}
              >
                <div className="mt-1">
                  {isChecked ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h3
                      className={`font-medium ${
                        isChecked ? "text-muted-foreground line-through" : ""
                      }`}
                    >
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.description}
                  </p>
                </div>
                {item.href && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Mensagem de conclusão */}
        {completedCount === totalCount && (
          <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Parabéns! Você completou a configuração inicial! 🎉
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
