import { GraduationCap } from "lucide-react";
import Link from "next/link";
export function AuthHeader() {
  return (
    <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
      <Link
        href="/"
        className="inline-block group transition-transform hover:scale-105"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-5 shadow-sm group-hover:shadow-md transition-all duration-300">
          <GraduationCap className="h-8 w-8 text-primary-foreground" />
        </div>
      </Link>
      <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
        UFAM Hub
      </h1>
      <p className="text-muted-foreground text-sm">
        Organizador acadêmico pessoal com IA
      </p>
    </div>
  );
}