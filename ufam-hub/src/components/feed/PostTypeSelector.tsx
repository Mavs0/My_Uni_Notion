"use client";

import { Trophy, BookOpen, Lightbulb, CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type FeedPostCategory,
  POST_CATEGORY_META,
} from "@/components/feed/feed-types";

const ICONS = {
  trophy: Trophy,
  book: BookOpen,
  lightbulb: Lightbulb,
  help: CircleHelp,
} as const;

export function PostTypeSelector({
  value,
  onChange,
  label,
}: {
  value: FeedPostCategory;
  onChange: (v: FeedPostCategory) => void;
  label: string;
}) {
  const keys = Object.keys(POST_CATEGORY_META) as FeedPostCategory[];

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[#6B7280] dark:text-[#A3A3A3]">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {keys.map((key) => {
          const meta = POST_CATEGORY_META[key];
          const Icon = ICONS[meta.icon];
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all duration-200",
                active
                  ? "border-[#05865E] bg-[#05865E]/12 text-[#05865E] shadow-sm ring-1 ring-[#05865E]/25 dark:bg-[#05865E]/15 dark:text-[#34D399]"
                  : "border-[#E5E7EB] bg-[#FAFAFA] text-[#374151] hover:border-[#05865E]/40 hover:bg-white dark:border-[#262626] dark:bg-[#151515] dark:text-[#D4D4D4] dark:hover:border-[#05865E]/35",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {meta.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
