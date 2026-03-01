import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  message: string | null | undefined;
  variant?: "error" | "success";
  className?: string;
}

export function ErrorMessage({
  message,
  variant = "error",
  className,
}: ErrorMessageProps) {
  if (!message) return null;

  const isError = variant === "error";

  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border p-4 text-sm flex items-start gap-3",
        isError
          ? "bg-destructive/10 border-destructive/20 text-destructive"
          : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300",
        className
      )}
    >
      {isError ? (
        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
      ) : (
        <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}
