"use client";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    href: string;
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
      className={`text-center py-8 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`${title}. ${description}`}
    >
      <Icon
        className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50"
        aria-hidden="true"
      />
      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {action && (
        <div className="flex flex-wrap items-center justify-center gap-3 w-full min-w-0">
          <Button asChild variant="default" className="gap-2">
            <Link href={action.href}>
              {action.icon && (
                <action.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              {action.label}
            </Link>
          </Button>
          {secondaryAction && (
            <Button asChild variant="outline">
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface EmptyStateCardProps extends EmptyStateProps {
  cardTitle?: string;
}

export function EmptyStateCard({
  cardTitle,
  ...emptyStateProps
}: EmptyStateCardProps) {
  return (
    <Card>
      {cardTitle && (
        <div className="px-5 pt-5">
          <h2 className="text-sm font-semibold text-foreground">{cardTitle}</h2>
        </div>
      )}
      <CardContent className={cardTitle ? "pt-4" : "pt-6"}>
        <EmptyState {...emptyStateProps} />
      </CardContent>
    </Card>
  );
}
