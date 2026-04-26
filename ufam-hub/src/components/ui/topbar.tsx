"use client";
import Link from "next/link";
import { Input } from "./input";
import { Button } from "./button";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import {
  Search,
  User,
  LogOut,
  Settings,
  LogIn,
  Menu,
  Focus,
  Bell,
  HelpCircle,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import * as React from "react";
import { useCommandPalette, CommandPalette } from "./command-palette";
import { NotificationCenter } from "@/components/NotificationCenter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { useMobileMenu } from "./mobile-menu-context";
import { Logo } from "@/components/Logo";
import { useFocusMode } from "@/contexts/FocusModeContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { FocusModeSettings } from "@/components/FocusModeSettings";
import { cn } from "@/lib/utils";
import { putProfileIfAuthenticated } from "@/lib/api/profile-put-client";

function ThemeSegment() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const saveTheme = async (value: string) => {
    try {
      const res = await putProfileIfAuthenticated({ tema_preferencia: value });
      if (res && !res.ok) {
        console.error("Erro ao salvar tema:", res.status);
      }
    } catch (e) {
      console.error("Erro ao salvar tema:", e);
    }
  };
  if (!mounted) return null;
  const current = theme ?? "system";
  const options: { value: string; label: string; icon: React.ReactNode }[] = [
    { value: "dark", label: "Escuro", icon: <Moon className="h-3.5 w-3.5" /> },
    { value: "light", label: "Claro", icon: <Sun className="h-3.5 w-3.5" /> },
    {
      value: "system",
      label: "Sistema",
      icon: <Monitor className="h-3.5 w-3.5" />,
    },
  ];
  return (
    <>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => {
            setTheme(opt.value);
            saveTheme(opt.value);
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors",
            current === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </>
  );
}

function TopBar() {
  const { open, setOpen } = useCommandPalette();
  const [q, setQ] = React.useState("");
  const router = useRouter();
  const { t } = useI18n();
  const { setMobileMenuOpen } = useMobileMenu();
  const focusMode = useFocusMode();
  const {
    isActive: isFocusModeActive,
    activate,
    deactivate,
  } = focusMode || {
    isActive: false,
    activate: () => {},
    deactivate: () => {},
  };
  const [showFocusSettings, setShowFocusSettings] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState<{
    nome: string;
    email: string;
    avatar_url: string;
  } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const handleSearchFocus = () => setOpen(true);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) setOpen(true);
  };
  React.useEffect(() => {
    let cancelled = false;

    const loadUserProfile = async () => {
      try {
        const supabase = createSupabaseBrowser();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (user) {
          setIsAuthenticated(true);

          try {
            const response = await fetch("/api/profile");
            if (response.ok && !cancelled) {
              const { profile } = await response.json();
              if (!cancelled) {
                setUserProfile({
                  nome: profile.nome || "",
                  email: profile.email || "",
                  avatar_url: profile.avatar_url || "",
                });
              }
            } else if (!cancelled) {
              setUserProfile({
                nome:
                  user.user_metadata?.nome ||
                  user.user_metadata?.full_name ||
                  "",
                email: user.email || "",
                avatar_url: user.user_metadata?.avatar_url || "",
              });
            }
          } catch {
            if (!cancelled) {
              setUserProfile({
                nome:
                  user.user_metadata?.nome ||
                  user.user_metadata?.full_name ||
                  "",
                email: user.email || "",
                avatar_url: user.user_metadata?.avatar_url || "",
              });
            }
          }
        } else {
          if (!cancelled) {
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Erro ao carregar perfil:", error);
        }
      }
    };

    loadUserProfile();

    return () => {
      cancelled = true;
    };
  }, []);
  const getInitials = (nome: string, email: string) => {
    if (nome) {
      const parts = nome.trim().split(" ");
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : nome.substring(0, 2).toUpperCase();
    }
    return email ? email.substring(0, 2).toUpperCase() : "U";
  };
  const handleLogout = async () => {
    try {
      const supabase = createSupabaseBrowser();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };
  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between gap-3 px-3 sm:px-4">
          {/* Lado esquerdo: Menu mobile + Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 shrink-0"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link
              href="/dashboard"
              className="shrink-0 transition-opacity hover:opacity-80 flex items-center gap-2"
            >
              <Logo
                size="md"
                showText={true}
                variant="minimal"
                priority
                pairedWithTitle
              />
              <span className="font-semibold text-base truncate">UFAM Hub</span>
            </Link>
          </div>

          {/* Centro: Barra de busca */}
          <form
            onSubmit={handleSubmit}
            className="relative hidden md:flex items-center flex-1 max-w-[600px] mx-auto group"
          >
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={handleSearchFocus}
              placeholder="Buscar (⌘K)..."
              className="pl-9 pr-9 h-9 text-sm border focus:border-primary/50 transition-all bg-background/50 backdrop-blur-sm hover:bg-background/70 focus:bg-background w-full"
            />
            <kbd className="pointer-events-none absolute right-3 hidden h-5 select-none items-center gap-1 rounded border bg-muted/80 px-1.5 font-mono text-[10px] text-muted-foreground sm:flex opacity-0 group-focus-within:opacity-100 transition-opacity">
              ⌘K
            </kbd>
          </form>

          {/* Lado direito: Notificações + Modo Foco + Tema + Avatar */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Notificações */}
            {isAuthenticated && <NotificationCenter />}

            {/* Modo Foco — escondido em telas muito pequenas para não apertar */}
            {isAuthenticated && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isFocusModeActive ? "default" : "ghost"}
                      size="icon"
                      onClick={() => {
                        if (isFocusModeActive) {
                          deactivate();
                        } else {
                          setShowFocusSettings(true);
                        }
                      }}
                      className="h-9 w-9 hidden sm:inline-flex"
                      aria-label={
                        isFocusModeActive
                          ? "Desativar Modo Foco"
                          : "Ativar Modo Foco"
                      }
                    >
                      <Focus
                        className={cn(
                          "h-4 w-4",
                          isFocusModeActive && "text-primary-foreground",
                        )}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {isFocusModeActive
                        ? "Desativar Modo Foco (ESC)"
                        : "Modo Foco (⌘⇧F)"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Modal de Configurações do Modo Foco */}
            {isAuthenticated && (
              <FocusModeSettings
                open={showFocusSettings}
                onOpenChange={setShowFocusSettings}
              />
            )}

            {/* Separador visual antes do avatar (só quando há ícones à esquerda) */}
            {isAuthenticated && (
              <div className="w-px h-6 bg-border mx-0.5 sm:mx-1" aria-hidden />
            )}

            {/* Avatar com menu (tema e opções dentro do dropdown — modelo 02) */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full ml-0.5 sm:ml-1 flex-shrink-0">
                    <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-border transition-shadow">
                      <AvatarImage
                        src={userProfile?.avatar_url}
                        alt={userProfile?.nome || "Usuário"}
                      />
                      <AvatarFallback>
                        {userProfile
                          ? getInitials(userProfile.nome, userProfile.email)
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 rounded-xl bg-background border shadow-lg p-0"
                >
                  {/* Itens do menu (modelo 02: Notificações, Ajuda, Configurações) */}
                  <div className="p-2">
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard"
                        className="flex items-center cursor-pointer rounded-lg py-2.5 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      >
                        <Bell className="mr-3 h-4 w-4" />
                        <span>Notificações</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/ajuda"
                        className="flex items-center cursor-pointer rounded-lg py-2.5 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      >
                        <HelpCircle className="mr-3 h-4 w-4" />
                        <span>Central de Ajuda</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/configuracoes"
                        className="flex items-center cursor-pointer rounded-lg py-2.5 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      >
                        <Settings className="mr-3 h-4 w-4" />
                        <span>{t.nav.configuracoes}</span>
                      </Link>
                    </DropdownMenuItem>
                  </div>

                  {/* Tema: Dark | Light | System */}
                  <div className="px-3 pb-3">
                    <div className="flex rounded-lg border bg-muted/30 p-0.5">
                      <ThemeSegment />
                    </div>
                  </div>

                  <DropdownMenuSeparator className="my-0" />

                  {/* Sair */}
                  <div className="p-2">
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer rounded-lg py-2.5 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 focus:text-foreground"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      <span>{t.comum.sair}</span>
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuSeparator className="my-0" />

                  {/* Usuário no rodapé (modelo 02) */}
                  <div className="p-3">
                    <Link
                      href="/perfil"
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage
                          src={userProfile?.avatar_url}
                          alt={userProfile?.nome || "Usuário"}
                        />
                        <AvatarFallback>
                          {userProfile
                            ? getInitials(userProfile.nome, userProfile.email)
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-sm font-medium truncate">
                          {userProfile?.nome || t.nav.perfil}
                        </p>
                        {userProfile?.email && (
                          <p className="text-xs text-muted-foreground truncate">
                            {userProfile.email}
                          </p>
                        )}
                      </div>
                    </Link>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default" size="sm">
                <Link href="/login" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Entrar</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      <CommandPalette open={open} setOpenAction={setOpen} />
    </>
  );
}

export default React.memo(TopBar);
