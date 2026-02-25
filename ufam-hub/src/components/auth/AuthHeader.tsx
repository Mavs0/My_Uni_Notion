import Link from "next/link";
import { Logo, LogoWithAnimation } from "@/components/Logo";

export function AuthHeader() {
  return (
    <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
      <Link
        href="/"
        className="inline-block group transition-transform hover:scale-105 duration-300"
      >
        <div className="mb-6 flex justify-center">
          <LogoWithAnimation />
        </div>
      </Link>
      <div className="space-y-2">
        <Logo size="lg" showText={true} variant="full" className="justify-center" />
        <p className="text-muted-foreground text-sm mt-2">
          Organizador acadêmico pessoal com IA
        </p>
      </div>
    </div>
  );
}