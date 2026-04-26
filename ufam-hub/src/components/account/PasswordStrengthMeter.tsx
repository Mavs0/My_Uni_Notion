"use client";

import { cn } from "@/lib/utils";
import { passwordStrengthLevel } from "@/lib/account/password-rules";

export function PasswordStrengthMeter({
  password,
  label,
  weak,
  medium,
  strong,
}: {
  password: string;
  label: string;
  weak: string;
  medium: string;
  strong: string;
}) {
  const level = passwordStrengthLevel(password);

  const labelText =
    level === 0 ? "" : level === 1 ? weak : level === 2 ? medium : strong;
  const labelClass =
    level === 0
      ? "text-[#6B7280] dark:text-[#737373]"
      : level === 1
        ? "text-[#DC2626] dark:text-[#F87171]"
        : level === 2
          ? "text-amber-600 dark:text-amber-400"
          : "text-[#16A34A] dark:text-[#22C55E]";

  const empty = "bg-[#E5E7EB] dark:bg-[#262626]";
  const segmentClass = (i: number) => {
    if (level === 0) return empty;
    if (level === 1) {
      return i === 0 ? "bg-[#DC2626]" : empty;
    }
    if (level === 2) {
      return i < 2 ? "bg-amber-500" : empty;
    }
    return "bg-[#16A34A] dark:bg-[#22C55E]";
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[#111827] dark:text-[#F5F5F5]">
        {label}
      </p>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "h-2 flex-1 rounded-full transition-all duration-300 ease-out",
              segmentClass(i),
            )}
          />
        ))}
      </div>
      {password ? (
        <p
          className={cn(
            "text-xs font-medium transition-colors duration-200",
            labelClass,
          )}
        >
          {labelText}
        </p>
      ) : (
        <p className="text-xs text-[#6B7280] dark:text-[#737373]">—</p>
      )}
    </div>
  );
}
