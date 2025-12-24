"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  FileText,
  Brain,
  Trophy,
  Users,
  Library,
  MessageSquare,
  Clock,
  Activity,
  ChevronLeft,
  ChevronRight,
  X,
  HelpCircle,
} from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./sheet";
import { useMobileMenu } from "./mobile-menu-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { HelpCenter } from "@/components/onboarding/HelpCenter";
interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  i18n?: string;
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
    ],
  },
  {
    title: "Aluno",
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
      {
        title: "Anotações",
        href: "/busca-anotacoes",
        icon: FileText,
      },
      {
        title: "Revisão",
        href: "/revisao",
        icon: Brain,
      },
      {
        title: "Pomodoro",
        href: "/pomodoro",
        icon: Clock,
      },
      {
        title: "Gamificação",
        href: "/gamificacao",
        icon: Trophy,
      },
      {
        title: "Descobrir",
        href: "/descobrir",
        icon: Users,
      },
      {
        title: "Feed",
        href: "/feed",
        icon: Activity,
      },
      {
        title: "Ajuda",
        href: "/ajuda",
        icon: HelpCircle,
      },
    ],
  },
  {
    title: "Grupos",
    items: [
      {
        title: "Grupos de Estudo",
        href: "/grupos",
        icon: Users,
      },
      {
        title: "Biblioteca",
        href: "/biblioteca",
        icon: Library,
      },
    ],
  },
  {
    title: "IA",
    items: [
      {
        title: "Chat IA",
        href: "/chat",
        icon: MessageSquare,
        i18n: "chat",
      },
    ],
  },
];
export function Sidebar() {
  const { mobileMenuOpen, setMobileMenuOpen } = useMobileMenu();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

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
  const NavContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            {(!collapsed || isMobile) && (
              <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
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
                      collapsed && !isMobile && "justify-center"
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
                      <TooltipContent side="right">{item.title}</TooltipContent>
                    </Tooltip>
                  );
                }
                return (
                  <React.Fragment key={item.href}>{linkElement}</React.Fragment>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t p-4">
        <HelpCenter
          trigger={
            <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
              <HelpCircle className="h-4 w-4" />
              {(!collapsed || isMobile) && <span>Ajuda</span>}
            </button>
          }
        />
      </div>
    </>
  );
  return (
    <TooltipProvider delayDuration={200}>
      {}
      <aside
        className={cn(
          "sticky top-0 h-[calc(100vh-3.5rem)] border-r bg-background transition-all duration-300 flex flex-col z-30",
          collapsed ? "w-16" : "w-64",
          "hidden md:flex"
        )}
        role="navigation"
        aria-label="Navegação principal"
      >
        {}
        <div className="flex items-center justify-end p-4 border-b">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
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
              <SheetTitle>UFAM Hub</SheetTitle>
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
