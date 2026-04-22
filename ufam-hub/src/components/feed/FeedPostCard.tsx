"use client";

import {
  Globe,
  Heart,
  MessageCircle,
  Bookmark,
  Trophy,
  BookOpen,
  Lightbulb,
  CircleHelp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { POST_CATEGORY_META } from "@/components/feed/feed-types";
import type { MockFeedPost } from "@/components/feed/feed-mock-data";
import { useState } from "react";

const ICONS = {
  trophy: Trophy,
  book: BookOpen,
  lightbulb: Lightbulb,
  help: CircleHelp,
} as const;

export function FeedPostCard({ post }: { post: MockFeedPost }) {
  const [saved, setSaved] = useState(false);
  const meta = POST_CATEGORY_META[post.category];
  const Icon = ICONS[meta.icon];
  const layout = post.imageLayout ?? "full";

  return (
    <article
      className={cn(
        "rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-[#262626] dark:bg-[#101010]",
      )}
    >
      <div
        className={cn(
          layout === "side" && post.imageUrl && "sm:flex sm:gap-4",
        )}
      >
        {layout === "side" && post.imageUrl ? (
          <div className="mb-3 shrink-0 overflow-hidden rounded-xl sm:mb-0 sm:w-36">
            <img
              src={post.imageUrl}
              alt=""
              className="h-32 w-full object-cover sm:h-full sm:min-h-[140px]"
            />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 shrink-0 ring-2 ring-[#05865E]/10">
              <AvatarImage src={post.avatarUrl} alt={post.userName} />
              <AvatarFallback className="bg-[#05865E]/15 text-xs font-semibold text-[#05865E]">
                {post.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[#111827] dark:text-[#F5F5F5]">
                  {post.userName}
                </span>
                <span className="flex items-center gap-1 text-xs text-[#6B7280] dark:text-[#A3A3A3]">
                  <Globe className="h-3 w-3" />
                  Público · {post.timeLabel}
                </span>
              </div>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#05865E]/35 bg-[#05865E]/10 px-2.5 py-0.5 text-xs font-medium text-[#05865E] dark:text-[#34D399]">
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                {meta.label}
              </span>
              <h3 className="mt-2 text-base font-semibold leading-snug text-[#111827] dark:text-[#F5F5F5]">
                {post.headline}
              </h3>
              {post.body ? (
                <p className="mt-1.5 text-sm leading-relaxed text-[#374151] dark:text-[#D4D4D4]">
                  {post.body}
                </p>
              ) : null}
            </div>
          </div>

          {post.imageUrl && layout !== "side" ? (
            <div
              className={cn(
                "mt-3 overflow-hidden rounded-xl border border-[#E5E7EB] dark:border-[#262626]",
                layout === "compact" && "max-w-xs",
              )}
            >
              <img
                src={post.imageUrl}
                alt=""
                className={cn(
                  "w-full object-cover",
                  layout === "compact" ? "max-h-40" : "max-h-72",
                )}
              />
            </div>
          ) : null}

          <div className="mt-4 flex items-center gap-1 border-t border-[#E5E7EB] pt-3 dark:border-[#262626]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-[#6B7280] hover:text-[#DC2626] dark:text-[#A3A3A3]"
            >
              <Heart className="h-4 w-4" />
              {post.likes}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-[#6B7280] dark:text-[#A3A3A3]"
            >
              <MessageCircle className="h-4 w-4" />
              {post.comments}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "ml-auto h-8",
                saved
                  ? "text-[#05865E]"
                  : "text-[#6B7280] dark:text-[#A3A3A3]",
              )}
              onClick={() => setSaved((s) => !s)}
            >
              <Bookmark
                className={cn("h-4 w-4", saved && "fill-current")}
              />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
