import Link from "next/link";
import { Logo } from "@/components/Logo";

export function AuthHeader() {
  return (
    <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
      <Link
        href="/"
        className="inline-flex flex-col items-center gap-2 group transition-transform hover:scale-[1.02] duration-300"
      >
        <Logo size="lg" showText={true} variant="full" className="justify-center" />
        <p className="text-muted-foreground text-sm">
          Organizador acadêmico pessoal com IA
        </p>
      </Link>
    </div>
  );
}