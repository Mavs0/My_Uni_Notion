/**
 * Tema visual premium dark para Mapa Mental (Chat IA).
 * Verde #05865E = foco / ação positiva; roxo suave = identidade da feature.
 */
export const MM = {
  page: "bg-[#050505] text-[#F5F5F5]",
  card: "rounded-2xl border border-[#262626] bg-[#101010] shadow-xl",
  cardInner: "rounded-xl border border-[#262626] bg-[#121212]",
  input:
    "rounded-xl border border-[#262626] bg-[#151515] text-[#F5F5F5] placeholder:text-[#737373]",
  muted: "text-[#A3A3A3]",
  label: "text-sm font-medium text-[#E5E5E5]",
  border: "border-[#262626]",
  accentPurple: "text-violet-400",
  accentPurpleBg: "bg-violet-500/10 border-violet-500/20",
  focus: "focus-visible:ring-2 focus-visible:ring-[#05865E]/45 focus-visible:border-[#05865E]/50",
  primary:
    "bg-[#05865E] text-white hover:bg-[#047a52] shadow-md shadow-[#05865E]/20",
  success: "text-[#16A34A]",
  danger: "text-[#DC2626]",
} as const;
