"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
}

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`text-center py-10 px-4 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`${title}. ${description}`}
    >
      <div className="flex justify-center mb-4">
        <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center">
          <Icon
            className="h-7 w-7 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {action && (
            action.href ? (
              <Button asChild variant="default" className="gap-2">
                <Link href={action.href}>
                  {action.icon && (
                    <action.icon className="h-4 w-4" aria-hidden="true" />
                  )}
                  {action.label}
                </Link>
              </Button>
            ) : (
              <Button
                variant="default"
                className="gap-2"
                onClick={action.onClick}
              >
                {action.icon && (
                  <action.icon className="h-4 w-4" aria-hidden="true" />
                )}
                {action.label}
              </Button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <Button asChild variant="outline">
                <Link href={secondaryAction.href}>
                  {secondaryAction.label}
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
