"use client";

import { cn } from "@/lib/utils";

export function AssistantRobotSvg({
  className,
}: {
  className?: string;
}) {
  return (
    <img
      src="/mascot/assistant-robot.png"
      alt=""
      draggable={false}
      aria-hidden
      className={cn(
        "pointer-events-none h-[4.75rem] w-auto select-none object-contain sm:h-[5.5rem]",
        className,
      )}
    />
  );
}
