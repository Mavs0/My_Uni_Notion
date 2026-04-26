"use client";

import { useState, useId, useEffect } from "react";
import { Lock, Loader2, Eye, EyeOff, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { allPasswordRulesMet } from "@/lib/account/password-rules";
import { PasswordRequirementsList } from "./PasswordRequirementsList";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";
import { SecurityInfoNotice } from "./SecurityInfoNotice";

function PasswordFieldRow({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  disabled,
  error,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder: string;
  disabled?: boolean;
  error?: string | null;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-sm font-semibold text-[#111827] dark:text-[#F5F5F5]"
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          className={cn(
            "h-11 rounded-xl border-[#E5E7EB] bg-[#FAFAFA] pr-11 text-[#111827] transition-shadow placeholder:text-[#6B7280] focus-visible:border-[#05865E] focus-visible:ring-[#05865E]/30 dark:border-[#262626] dark:bg-[#151515] dark:text-[#F5F5F5] dark:placeholder:text-[#737373]",
            error &&
              "border-[#DC2626] focus-visible:border-[#DC2626] focus-visible:ring-red-500/25 dark:border-red-500/60",
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-black/5 hover:text-[#111827] disabled:opacity-40 dark:text-[#A3A3A3] dark:hover:bg-white/10 dark:hover:text-[#F5F5F5]"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <Eye className="h-4 w-4" strokeWidth={1.75} />
          )}
        </button>
      </div>
      {error ? (
        <p className="text-xs font-medium text-[#DC2626] dark:text-[#F87171]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export type ChangePasswordCardCopy = {
  badge: string;
  title: string;
  subtitle: string;
  currentLabel: string;
  newLabel: string;
  confirmLabel: string;
  currentPh: string;
  newPh: string;
  confirmPh: string;
  requirementsTitle: string;
  reqMin: string;
  reqNumber: string;
  reqSpecial: string;
  strengthLabel: string;
  weak: string;
  medium: string;
  strong: string;
  cancel: string;
  submit: string;
  submitting: string;
  securityTitle: string;
  securitySubtitle: string;
  errRequired: string;
  errMismatch: string;
  errRules: string;
};

export function ChangePasswordCard({
  currentPassword,
  newPassword,
  confirmPassword,
  onCurrentChange,
  onNewChange,
  onConfirmChange,
  onSubmit,
  onCancel,
  submitting,
  serverError,
  onDismissServerError,
  copy,
}: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  onCurrentChange: (v: string) => void;
  onNewChange: (v: string) => void;
  onConfirmChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  serverError: string | null;
  onDismissServerError: () => void;
  copy: ChangePasswordCardCopy;
}) {
  const baseId = useId();
  const [touched, setTouched] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (!currentPassword && !newPassword && !confirmPassword) {
      setTouched({ current: false, new: false, confirm: false });
    }
  }, [currentPassword, newPassword, confirmPassword]);

  const rulesOk = allPasswordRulesMet(newPassword);
  const confirmMismatch =
    touched.confirm && confirmPassword.length > 0 && newPassword !== confirmPassword;
  const currentEmpty = touched.current && !currentPassword.trim();
  const newEmpty = touched.new && !newPassword;
  const confirmEmpty = touched.confirm && !confirmPassword;

  const formValid =
    currentPassword.trim().length > 0 &&
    rulesOk &&
    newPassword === confirmPassword &&
    confirmPassword.length > 0;

  const handleSubmit = () => {
    setTouched({ current: true, new: true, confirm: true });
    onDismissServerError();
    if (!currentPassword.trim()) return;
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) return;
    if (!rulesOk) return;
    onSubmit();
  };

  const handleCancel = () => {
    onDismissServerError();
    onCancel();
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm dark:border-[#262626] dark:bg-[#101010]",
        "animate-in fade-in slide-in-from-bottom-4 duration-500",
      )}
    >
      <div className="border-b border-[#E5E7EB] px-5 py-5 dark:border-[#262626] sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#05865E]/15 ring-1 ring-[#05865E]/30"
              aria-hidden
            >
              <Lock className="h-6 w-6 text-[#05865E]" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-[#111827] dark:text-[#F5F5F5]">
                {copy.title}
              </h2>
              <p className="mt-1 text-sm text-[#6B7280] dark:text-[#A3A3A3]">
                {copy.subtitle}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 gap-1 border-[#05865E]/40 bg-[#05865E]/[0.06] text-[#05865E] dark:border-[#05865E]/45 dark:bg-[#05865E]/10 dark:text-[#34D399]"
          >
            <Shield className="h-3 w-3" strokeWidth={1.75} />
            {copy.badge}
          </Badge>
        </div>
      </div>

      <div className="space-y-6 px-5 py-6 sm:px-6">
        {serverError ? (
          <div
            role="alert"
            className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
          >
            {serverError}
          </div>
        ) : null}

        <div className="space-y-5">
          <PasswordFieldRow
            id={`${baseId}-current`}
            label={`${copy.currentLabel} *`}
            value={currentPassword}
            onChange={(v) => {
              onCurrentChange(v);
              if (serverError) onDismissServerError();
            }}
            onBlur={() => setTouched((t) => ({ ...t, current: true }))}
            placeholder={copy.currentPh}
            disabled={submitting}
            error={currentEmpty ? copy.errRequired : null}
            autoComplete="current-password"
          />
          <PasswordFieldRow
            id={`${baseId}-new`}
            label={`${copy.newLabel} *`}
            value={newPassword}
            onChange={(v) => {
              onNewChange(v);
              if (serverError) onDismissServerError();
            }}
            onBlur={() => setTouched((t) => ({ ...t, new: true }))}
            placeholder={copy.newPh}
            disabled={submitting}
            error={
              newEmpty
                ? copy.errRequired
                : touched.new && newPassword && !rulesOk
                  ? copy.errRules
                  : null
            }
            autoComplete="new-password"
          />

          <PasswordRequirementsList
            password={newPassword}
            labels={{
              title: copy.requirementsTitle,
              minLen: copy.reqMin,
              number: copy.reqNumber,
              special: copy.reqSpecial,
            }}
          />

          <PasswordStrengthMeter
            password={newPassword}
            label={copy.strengthLabel}
            weak={copy.weak}
            medium={copy.medium}
            strong={copy.strong}
          />

          <PasswordFieldRow
            id={`${baseId}-confirm`}
            label={`${copy.confirmLabel} *`}
            value={confirmPassword}
            onChange={(v) => {
              onConfirmChange(v);
              if (serverError) onDismissServerError();
            }}
            onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
            placeholder={copy.confirmPh}
            disabled={submitting}
            error={
              confirmEmpty
                ? copy.errRequired
                : confirmMismatch
                  ? copy.errMismatch
                  : null
            }
            autoComplete="new-password"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={submitting}
            className="h-11 rounded-xl border-[#E5E7EB] bg-transparent hover:bg-black/[0.03] dark:border-[#333] dark:hover:bg-white/[0.04]"
          >
            {copy.cancel}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !formValid}
            className="h-11 gap-2 rounded-xl bg-[#05865E] px-5 text-white shadow-md shadow-[#05865E]/20 hover:bg-[#047a52] disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {copy.submitting}
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                {copy.submit}
              </>
            )}
          </Button>
        </div>

        <SecurityInfoNotice
          title={copy.securityTitle}
          subtitle={copy.securitySubtitle}
        />
      </div>
    </div>
  );
}
