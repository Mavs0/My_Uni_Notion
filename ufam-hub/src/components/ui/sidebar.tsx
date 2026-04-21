"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  FileText,
  Users,
  Library,
  MessageSquare,
  Clock,
  Activity,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  HelpCircle,
  Calendar,
  Link2,
  Zap,
  UserPlus,
  Sparkles,
} from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader } from "./sheet";
import { useMobileMenu } from "./mobile-menu-context";
import { Logo } from "@/components/Logo";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { useCommandPaletteOpen } from "./command-palette";
interface NavLink {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  i18n?: string;
}
interface NavSubmenu {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavLink[];
}
type NavItem = NavLink | NavSubmenu;
function isSubmenu(item: NavItem): item is NavSubmenu {
  return "items" in item;
}
interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Geral",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        i18n: "dashboard",
      },
      { title: "Ajuda", href: "/ajuda", icon: HelpCircle },
    ],
  },
  {
    title: "Aluno",
    items: [
      {
        title: "Ensino",
        icon: BookOpen,
        items: [
          {
            title: "Disciplinas",
            href: "/disciplinas",
            icon: BookOpen,
            i18n: "disciplinas",
          },
          {
            title: "Avaliações",
            href: "/avaliacoes",
            icon: GraduationCap,
            i18n: "avaliacoes",
          },
          { title: "Anotações", href: "/busca-anotacoes", icon: FileText },
          /* Flashcards / revisão: atalho na página de Anotações (ações rápidas)
          { title: "Flashcards", href: "/revisao", icon: Brain },
          */
          {
            title: "Chat IA",
            href: "/chat",
            icon: MessageSquare,
            i18n: "chat",
          },
        ],
      },
      { title: "Pomodoro", href: "/pomodoro", icon: Clock },
      {
        title: "Conectar",
        icon: Link2,
        items: [
          { title: "Descobrir", href: "/descobrir", icon: Users },
          { title: "Feed", href: "/feed", icon: Activity },
          { title: "Eventos", href: "/eventos", icon: Calendar },
        ],
      },
    ],
  },
  {
    title: "Grupos",
    items: [
      { title: "Grupos de Estudo", href: "/grupos", icon: Users },
      { title: "Biblioteca", href: "/biblioteca", icon: Library },
    ],
  },
];
export function Sidebar() {
  const { mobileMenuOpen, setMobileMenuOpen } = useMobileMenu();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [openSubmenus, setOpenSubmenus] = React.useState<Set<string>>(
    new Set(["Ensino", "Conectar"]),
  );
  const openCommandPalette = useCommandPaletteOpen();

  React.useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") {
      setCollapsed(true);
    }
  }, []);

  React.useEffect(() => {
    if (mounted) {
      localStorage.setItem("sidebar-collapsed", String(collapsed));
    }
  }, [collapsed, mounted]);

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const isSubmenuActive = (submenu: NavSubmenu) =>
    submenu.items.some(
      (sub) => pathname === sub.href || pathname.startsWith(sub.href + "/"),
    );

  const NavContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      <nav className="flex-1 overflow-y-auto flex flex-col min-h-0">
        {/* Quick actions (inspiração: primeiro item com atalho) */}
        <div className="p-3 border-b border-border/50">
          <button
            type="button"
            onClick={() => openCommandPalette(true)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              collapsed && !isMobile && "justify-center px-2",
            )}
          >
            <Zap className="h-5 w-5 shrink-0 text-primary" />
            {(!collapsed || isMobile) && (
              <>
                <span className="flex-1 text-left">Quick actions</span>
                <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                  ⌘K
                </kbd>
              </>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {navSections.map((section) => (
            <div key={section.title}>
              {(!collapsed || isMobile) && (
                <h3 className="mb-2 px-2 text-[11px] font-medium text-muted-foreground tracking-wide">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  if (isSubmenu(item)) {
                    const Icon = item.icon;
                    const isOpen = openSubmenus.has(item.title);
                    const hasActive = isSubmenuActive(item);

                    if (collapsed && !isMobile) {
                      return (
                        <DropdownMenu key={item.title}>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                "flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                hasActive
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                              )}
                            >
                              <Icon className="h-5 w-5 shrink-0" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            side="right"
                            align="start"
                            sideOffset={8}
                            className="rounded-xl border border-border/60 bg-card/95 shadow-lg p-0 min-w-[11rem] overflow-hidden"
                          >
                            <DropdownMenuLabel className="px-3 py-2 border-b border-border/60 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground rounded-t-xl focus:bg-transparent">
                              {item.title}
                            </DropdownMenuLabel>
                            <div className="p-1.5 space-y-0.5">
                              {item.items.map((sub) => {
                                const SubIcon = sub.icon;
                                const isActive =
                                  pathname === sub.href ||
                                  pathname.startsWith(sub.href + "/");
                                return (
                                  <DropdownMenuItem key={sub.href} asChild>
                                    <Link
                                      href={sub.href}
                                      className={cn(
                                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer",
                                        isActive
                                          ? "bg-primary text-primary-foreground shadow-sm"
                                          : "text-muted-foreground focus:bg-accent focus:text-accent-foreground",
                                      )}
                                    >
                                      <SubIcon className="h-4 w-4 shrink-0 opacity-80" />
                                      {sub.title}
                                    </Link>
                                  </DropdownMenuItem>
                                );
                              })}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      );
                    }

                    return (
                      <div key={item.title}>
                        <button
                          type="button"
                          onClick={() => toggleSubmenu(item.title)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            hasActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                            collapsed && !isMobile && "justify-center",
                          )}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          {(!collapsed || isMobile) && (
                            <>
                              <span className="flex-1 text-left">
                                {item.title}
                              </span>
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 transition-transform",
                                  isOpen && "rotate-180",
                                )}
                              />
                            </>
                          )}
                        </button>
                        {isOpen && (!collapsed || isMobile) && (
                          <div className="ml-2 mt-2 rounded-xl border border-border/60 bg-muted/30 overflow-hidden">
                            <div className="px-3 py-2 border-b border-border/60">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {item.title}
                              </p>
                            </div>
                            <div className="p-1.5 space-y-0.5">
                              {item.items.map((sub) => {
                                const SubIcon = sub.icon;
                                const isActive =
                                  pathname === sub.href ||
                                  pathname.startsWith(sub.href + "/");
                                return (
                                  <Link
                                    key={sub.href}
                                    href={sub.href}
                                    onClick={
                                      isMobile
                                        ? () => setMobileMenuOpen(false)
                                        : undefined
                                    }
                                    className={cn(
                                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                      isActive
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                    )}
                                  >
                                    <SubIcon className="h-4 w-4 shrink-0 opacity-80" />
                                    <span>{sub.title}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  const linkElement = (
                    <Link
                      href={item.href}
                      onClick={
                        isMobile ? () => setMobileMenuOpen(false) : undefined
                      }
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        collapsed && !isMobile && "justify-center",
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {(!collapsed || isMobile) && <span>{item.title}</span>}
                    </Link>
                  );
                  if (collapsed && !isMobile) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
                        <TooltipContent side="right">
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }
                  return (
                    <React.Fragment key={item.href}>
                      {linkElement}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer (inspiração: invite, help, CTA) */}
        <div
          className={cn(
            "border-t border-border/50 p-3 space-y-0.5",
            (!collapsed || isMobile) && "mt-auto",
          )}
        >
          <Link
            href="/descobrir"
            onClick={isMobile ? () => setMobileMenuOpen(false) : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
              collapsed && !isMobile && "justify-center px-2",
            )}
          >
            <UserPlus className="h-5 w-5 shrink-0" />
            {(!collapsed || isMobile) && <span>Convidar colegas</span>}
          </Link>
          <Link
            href="/ajuda"
            onClick={isMobile ? () => setMobileMenuOpen(false) : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
              collapsed && !isMobile && "justify-center px-2",
            )}
          >
            <HelpCircle className="h-5 w-5 shrink-0" />
            {(!collapsed || isMobile) && (
              <>
                <span>Ajuda e primeiros passos</span>
                <Sparkles className="h-4 w-4 ml-auto text-primary/70" />
              </>
            )}
          </Link>
        </div>
      </nav>
    </>
  );
  return (
    <TooltipProvider delayDuration={200}>
      {}
      <aside
        className={cn(
          "sticky top-0 h-[calc(100vh-3.5rem)] border-r bg-background/95 transition-all duration-300 flex flex-col z-30",
          collapsed ? "w-16" : "w-64",
          "hidden md:flex",
        )}
        role="navigation"
        aria-label="Navegação principal"
      >
        {/* Header: logo + nome (inspiração anexo) */}
        <div className="flex items-center justify-between gap-2 p-3 border-b border-border/50 min-h-[3.5rem]">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2 min-w-0 rounded-lg hover:opacity-90 transition-opacity",
              collapsed && "justify-center w-full",
            )}
          ></Link>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
                aria-expanded={!collapsed}
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? "Expandir" : "Recolher"}
            </TooltipContent>
          </Tooltip>
        </div>
        <NavContent />
      </aside>
      {}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <Logo size="sm" showText={true} variant="minimal" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>
          <NavContent isMobile />
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
