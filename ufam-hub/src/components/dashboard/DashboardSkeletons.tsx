"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border bg-card p-4 animate-pulse">
          <div className="h-8 bg-muted rounded w-16 mb-2" />
          <div className="h-4 bg-muted rounded w-20" />
        </div>
      ))}
    </div>
  );
}

export function GradeSemanalSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="h-5 bg-muted rounded w-32 animate-pulse" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-6 gap-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-8 bg-muted rounded animate-pulse" />
            ))}
          </div>
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="grid grid-cols-6 gap-1">
              {[1, 2, 3, 4, 5, 6].map((col) => (
                <div
                  key={col}
                  className="h-16 bg-muted rounded animate-pulse"
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AvaliacoesSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-start justify-between gap-3 rounded-lg border p-3 animate-pulse"
        >
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EventosSemanaSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border p-3 animate-pulse">
          <div className="flex items-start gap-2">
            <div className="h-4 w-4 rounded-full bg-muted mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MetasSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="h-5 bg-muted rounded w-32 animate-pulse" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-3 bg-muted rounded w-24" />
                <div className="h-3 bg-muted rounded w-8" />
              </div>
              <div className="h-2 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function EstatisticasSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="h-5 bg-muted rounded w-48 animate-pulse" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 bg-muted rounded w-20 animate-pulse"
              />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border p-3 animate-pulse">
                <div className="h-6 bg-muted rounded w-12 mx-auto mb-2" />
                <div className="h-3 bg-muted rounded w-20 mx-auto" />
              </div>
            ))}
          </div>
          <div className="h-48 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
