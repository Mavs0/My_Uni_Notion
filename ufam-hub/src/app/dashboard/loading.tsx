import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <main className="flex-1 p-4 md:p-6 space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-48 mb-2" />
        <div className="h-4 bg-muted rounded w-64" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-4 animate-pulse">
            <div className="h-10 w-10 rounded-lg bg-muted mb-3" />
            <div className="h-6 bg-muted rounded w-12 mb-1" />
            <div className="h-4 bg-muted rounded w-20" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </main>
  );
}
