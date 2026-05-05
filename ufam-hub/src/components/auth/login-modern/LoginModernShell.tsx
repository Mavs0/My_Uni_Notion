"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import type { LucideIcon } from "lucide-react";
import { Brain, CalendarDays, Users } from "lucide-react";
import {
  LoginModernPrimaryForm,
  type LoginModernPrimaryFormProps,
  type HoverZone,
} from "./LoginModernPrimaryForm";
import type { MascotFocus } from "./useMascotAttention";
import { LOGIN_GREEN, LOGIN_TEXT } from "./theme";
import { AuthModernShell } from "./AuthModernShell";

const LOGIN_FEATURES: {
  Icon: LucideIcon;
  title: string;
  subtitle: string;
}[] = [
  {
    Icon: Brain,
    title: "Inteligência que acompanha você",
    subtitle: "IA para simplificar seus estudos",
  },
  {
    Icon: CalendarDays,
    title: "Organize tudo em um só lugar",
    subtitle: "Disciplinas, tarefas e prazos",
  },
  {
    Icon: Users,
    title: "Conecte-se e colabore",
    subtitle: "Aprenda junto com outras pessoas",
  },
];

export type LoginModernShellProps = Omit<
  LoginModernPrimaryFormProps,
  | "shake"
  | "onFocusEmail"
  | "onBlurEmail"
  | "onFocusPassword"
  | "onBlurPassword"
  | "onHover"
> & {
  successPulse?: boolean;
  clearedSlot?: React.ReactNode;
  messageSlot?: React.ReactNode;
};

export function LoginModernShell({
  successPulse,
  clearedSlot,
  messageSlot,
  ...formProps
}: LoginModernShellProps) {
  const { resolvedTheme } = useTheme();
  const lightMode = resolvedTheme === "light";
  const [focus, setFocus] = React.useState<MascotFocus>(null);
  const [shake, setShake] = React.useState(false);
  const prevErr = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (formProps.error && formProps.error !== prevErr.current) {
      setShake(true);
      const t = window.setTimeout(() => setShake(false), 480);
      prevErr.current = formProps.error;
      return () => window.clearTimeout(t);
    }
    if (!formProps.error) prevErr.current = null;
  }, [formProps.error]);

  const mascotMode = React.useMemo(() => {
    if (successPulse) return "success" as const;
    if (formProps.loading) return "loading" as const;
    if (focus === "password") return "focus-password" as const;
    if (formProps.error) return "error" as const;
    if (focus === "email") return "focus-email" as const;
    return "idle" as const;
  }, [successPulse, formProps.loading, formProps.error, focus]);

  const formHover = React.useCallback((z: HoverZone) => {
    if (z === "email") setFocus("email");
    else if (z === "password") setFocus("password");
  }, []);

  return (
    <AuthModernShell
      lightMode={lightMode}
      eyebrow="Olá! 👋"
      title={
        <>
          Bem-vindo{" "}
          <span style={{ color: LOGIN_GREEN }} className="font-semibold">
            de volta!
          </span>
        </>
      }
      description="Faça login para continuar organizando seus estudos e alcançando seus objetivos."
      features={LOGIN_FEATURES}
      speechBubble={{
        default: "Vamos juntos nessa jornada? 🚀",
        password: "Prometo não olhar! 🙈",
      }}
      mascotMode={mascotMode}
      mascotFocus={focus}
      mascotAttentionDisabled={
        Boolean(successPulse) || formProps.loading || focus === "password"
      }
      topSlots={
        <>
          {clearedSlot}
          {messageSlot}
        </>
      }
    >
      <LoginModernPrimaryForm
        {...formProps}
        shake={shake}
        lightMode={lightMode}
        onFocusEmail={() => setFocus("email")}
        onBlurEmail={() => setFocus(null)}
        onFocusPassword={() => setFocus("password")}
        onBlurPassword={() => setFocus(null)}
        onHover={formHover}
      />
    </AuthModernShell>
  );
}
