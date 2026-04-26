"use client";

import { Check, Circle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getPasswordRuleChecks,
  type PasswordRuleChecks,
} from "@/lib/account/password-rules";

type RowProps = {
  met: boolean;
  hasInput: boolean;
  label: string;
};

function RequirementRow({ met, hasInput, label }: RowProps) {
  const fail = hasInput && !met;
  const ok = hasInput && met;
  const neutral = !hasInput;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 text-sm transition-colors duration-200",
        neutral && "text-[#6B7280] dark:text-[#737373]",
        ok && "text-[#16A34A] dark:text-[#22C55E]",
        fail && "text-[#DC2626] dark:text-[#F87171]",
      )}
    >
      {neutral ? (
        <Circle className="h-4 w-4 shrink-0 opacity-50" strokeWidth={1.75} />
      ) : met ? (
        <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />
      ) : (
        <X className="h-4 w-4 shrink-0" strokeWidth={2.25} />
      )}
      <span>{label}</span>
    </div>
  );
}

export function PasswordRequirementsList({
  password,
  labels,
}: {
  password: string;
  labels: {
    title: string;
    minLen: string;
    number: string;
    special: string;
  };
}) {
  const hasInput = password.length > 0;
  const c: PasswordRuleChecks = hasInput
    ? getPasswordRuleChecks(password)
    : { minLen: false, hasNumber: false, hasSpecial: false };

  return (
    <div className="space-y-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-4 dark:border-[#262626] dark:bg-[#151515]">
      <p className="text-sm font-medium text-[#111827] dark:text-[#F5F5F5]">
        {labels.title}
      </p>
      <div className="space-y-2">
        <RequirementRow
          met={c.minLen}
          hasInput={hasInput}
          label={labels.minLen}
        />
        <RequirementRow
          met={c.hasNumber}
          hasInput={hasInput}
          label={labels.number}
        />
        <RequirementRow
          met={c.hasSpecial}
          hasInput={hasInput}
          label={labels.special}
        />
      </div>
    </div>
  );
}
