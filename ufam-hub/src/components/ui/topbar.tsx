"use client";
import Link from "next/link";
import { Input } from "./input";
import { Button } from "./button";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { ThemeToggle } from "./theme-toggle";
import { Search, User, LogOut, Settings, LogIn, Menu } from "lucide-react";
import * as React from "react";
import { useCommandPalette, CommandPalette } from "./command-palette";
import { AccessibilitySettings } from "@/components/AccessibilitySettings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { useMobileMenu } from "./mobile-menu-context";
export default function TopBar() {
  const { open, setOpen } = useCommandPalette();
  const [q, setQ] = React.useState("");
  const router = useRouter();
  const { t } = useI18n();
  const { setMobileMenuOpen } = useMobileMenu();
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
    const loadUserProfile = async () => {
      try {
        const supabase = createSupabaseBrowser();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setIsAuthenticated(true);
          const response = await fetch("/api/profile");
          if (response.ok) {
            const { profile } = await response.json();
            setUserProfile({
              nome: profile.nome || "",
              email: profile.email || "",
              avatar_url: profile.avatar_url || "",
            });
          } else {
            setUserProfile({
              nome:
                user.user_metadata?.nome || user.user_metadata?.full_name || "",
              email: user.email || "",
              avatar_url: user.user_metadata?.avatar_url || "",
            });
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      }
    };
    loadUserProfile();
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
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-4 px-4">
          {}
          <div className="flex items-center gap-4">
            {}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            {}
            <Link
              href="/dashboard"
              className="text-lg font-semibold hover:text-primary transition-colors shrink-0"
            >
              UFAM Hub
            </Link>
          </div>
          {}
          <div className="flex items-center gap-4 flex-1 justify-end">
            {}
            <form
              onSubmit={handleSubmit}
              className="relative hidden md:flex items-center flex-1 min-w-[400px] max-w-[600px] group"
            >
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={handleSearchFocus}
                placeholder="Buscar (⌘K)..."
                className="pl-9 pr-9 h-10 text-base border-2 focus:border-primary/50 transition-all bg-background/50 backdrop-blur-sm hover:bg-background/70 focus:bg-background w-full"
              />
              <kbd className="pointer-events-none absolute right-3 hidden h-5 select-none items-center gap-1 rounded border bg-muted/80 px-1.5 font-mono text-[10px] text-muted-foreground sm:flex opacity-0 group-focus-within:opacity-100 transition-opacity">
                ⌘K
              </kbd>
            </form>
            <div className="flex items-center gap-2 shrink-0">
              {}
              <AccessibilitySettings />
              <ThemeToggle />
              {}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
                      <Avatar className="h-8 w-8">
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
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      {userProfile?.nome || t.nav.perfil}
                    </DropdownMenuLabel>
                    {userProfile?.email && (
                      <p className="text-xs text-muted-foreground px-2 py-1">
                        {userProfile.email}
                      </p>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/perfil"
                        className="flex items-center cursor-pointer"
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>{t.nav.perfil}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/configuracoes"
                        className="flex items-center cursor-pointer"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>{t.nav.configuracoes}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-destructive focus:text-destructive"
                      variant="destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t.comum.sair}</span>
                    </DropdownMenuItem>
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
        </div>
      </header>
      <CommandPalette open={open} setOpen={setOpen} />
    </>
  );
}
