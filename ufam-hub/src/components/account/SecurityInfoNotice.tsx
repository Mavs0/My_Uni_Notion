"use client";

import { Shield } from "lucide-react";

export function SecurityInfoNotice({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA]/80 p-4 dark:border-[#262626] dark:bg-[#151515]/80">
      <Shield
        className="mt-0.5 h-5 w-5 shrink-0 text-[#05865E]"
        strokeWidth={1.75}
      />
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium leading-snug text-[#111827] dark:text-[#F5F5F5]">
          {title}
        </p>
        <p className="text-xs leading-relaxed text-[#6B7280] dark:text-[#A3A3A3]">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
