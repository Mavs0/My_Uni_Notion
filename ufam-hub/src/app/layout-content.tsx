"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import TopBar from "../components/ui/topbar";
import { Sidebar } from "../components/ui/sidebar";
import { VirtualAssistant } from "../components/VirtualAssistant";
import { MobileMenuProvider } from "../components/ui/mobile-menu-context";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const authPages = ["/login", "/esqueci-senha", "/resetar-senha"];
  const isAuthPage = authPages.includes(pathname);
  const isErrorPage = pathname === "/404" || pathname === "/500";
  useEffect(() => {
    setMounted(true);
  }, []);
  if (isAuthPage || isErrorPage) {
    return <>{children}</>;
  }
  return (
    <MobileMenuProvider>
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 max-w-6xl mx-auto w-full">{children}</main>
      </div>
      <VirtualAssistant />
    </MobileMenuProvider>
  );
}
