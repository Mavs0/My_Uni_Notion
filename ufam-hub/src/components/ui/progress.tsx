import * as React from "react";
import { cn } from "@/lib/utils";
interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
}
function Progress({ value, max = 100, className, ...props }: ProgressProps) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800",
        className
      )}
      {...props}
    >
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
export { Progress };