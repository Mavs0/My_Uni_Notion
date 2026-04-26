import { cn } from "@/lib/utils";

const accent = "#05865E";

export function UfamErrorIllustration404({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 320"
      className={cn("h-full w-full max-h-[min(52vw,280px)] lg:max-h-[320px]", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <radialGradient id="g404" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="55%" stopColor={accent} stopOpacity="0.06" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5f5f5" />
          <stop offset="100%" stopColor="#c8c8c8" />
        </linearGradient>
        <filter id="soft404" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="210" cy="120" rx="160" ry="130" fill="url(#g404)" />
      <ellipse cx="210" cy="268" rx="72" ry="10" fill="#000" opacity="0.45" />
      <ellipse cx="208" cy="266" rx="18" ry="5" fill="#1a1a1c" opacity="0.9" />

      <g filter="url(#soft404)">
        <rect x="155" y="95" width="90" height="110" rx="22" fill="url(#metal)" />
        <rect x="168" y="118" width="64" height="38" rx="8" fill="#1e1e22" />
        <circle cx="188" cy="137" r="5" fill="#3b82f6" opacity="0.85" />
        <circle cx="212" cy="137" r="5" fill="#3b82f6" opacity="0.55" />
        <path
          d="M178 152 Q200 162 222 148"
          stroke="#64748b"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <rect x="198" y="72" width="6" height="28" rx="2" fill="#d4d4d4" />
        <circle cx="201" cy="68" r="5" fill={accent} />
        <rect x="175" y="175" width="24" height="40" rx="10" fill="url(#metal)" />
        <rect x="201" y="175" width="24" height="40" rx="10" fill="url(#metal)" />
      </g>

      <g transform="translate(248, 118) rotate(12)">
        <circle cx="28" cy="28" r="26" stroke={accent} strokeWidth="5" fill="none" opacity="0.9" />
        <line x1="48" y1="48" x2="68" y2="72" stroke={accent} strokeWidth="5" strokeLinecap="round" />
      </g>

      <rect
        x="72"
        y="48"
        width="56"
        height="44"
        rx="12"
        fill="#0f0f12"
        stroke={accent}
        strokeOpacity="0.5"
        strokeWidth="1.5"
      />
      <text x="100" y="78" textAnchor="middle" fill={accent} fontSize="28" fontWeight="700" fontFamily="system-ui">
        ?
      </text>

      <circle cx="320" cy="200" r="3" fill={accent} opacity="0.5" />
      <circle cx="95" cy="210" r="2" fill="#fff" opacity="0.25" />
      <path d="M340 80 L355 95 M355 80 L340 95" stroke={accent} strokeOpacity="0.35" strokeWidth="1.5" />
    </svg>
  );
}

export function UfamErrorIllustration500({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 320"
      className={cn("h-full w-full max-h-[min(52vw,280px)] lg:max-h-[320px]", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <radialGradient id="g500" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.4" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rack" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2a2a30" />
          <stop offset="100%" stopColor="#121216" />
        </linearGradient>
      </defs>

      <ellipse cx="240" cy="40" rx="90" ry="24" fill="#fff" opacity="0.04" />
      <ellipse cx="320" cy="32" rx="70" ry="18" fill="#fff" opacity="0.03" />
      <ellipse cx="160" cy="36" rx="60" ry="16" fill="#fff" opacity="0.025" />

      <ellipse cx="205" cy="115" rx="130" ry="100" fill="url(#g500)" />

      <rect x="130" y="175" width="150" height="120" rx="12" fill="url(#rack)" stroke="#ffffff18" strokeWidth="1" />
      <rect x="142" y="188" width="126" height="22" rx="4" fill="#0d0d10" />
      <rect x="142" y="218" width="126" height="22" rx="4" fill="#0d0d10" />
      <rect x="142" y="248" width="126" height="22" rx="4" fill="#0d0d10" />
      <circle cx="154" cy="199" r="3" fill={accent} opacity="0.9" />
      <circle cx="166" cy="199" r="3" fill="#444" />
      <circle cx="154" cy="229" r="3" fill="#ef4444" opacity="0.85" />
      <circle cx="154" cy="259" r="3" fill={accent} opacity="0.6" />

      <rect x="168" y="132" width="76" height="62" rx="18" fill="#e8e8ea" />
      <rect x="182" y="148" width="48" height="28" rx="6" fill="#1a1a1e" />
      <path d="M192 162 L198 168 M198 162 L192 168" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M214 162 L220 168 M220 162 L214 168" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M188 178 Q206 184 224 172"
        stroke="#64748b"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      <rect x="198" y="118" width="14" height="22" rx="2" fill="#d4d4d8" />

      <path
        d="M72 260 L108 248 L95 275 Z"
        fill="#fbbf24"
        stroke="#fcd34d"
        strokeWidth="1.5"
        opacity="0.95"
      />
      <text x="88" y="268" textAnchor="middle" fill="#1c1917" fontSize="18" fontWeight="800" fontFamily="system-ui">
        !
      </text>

      <path
        d="M285 255 L310 230 M302 248 L318 262"
        stroke={accent}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path d="M275 268 Q290 252 305 268" stroke="#94a3b8" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="312" cy="270" r="5" fill="#334155" />
      <circle cx="318" cy="255" r="4" fill={accent} opacity="0.7" />

      <path d="M260 95 L268 115 M272 88 L280 108" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <path d="M285 102 L295 125" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}
