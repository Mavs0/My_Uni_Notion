"use client";

import { FeedPostCard } from "./FeedPostCard";
import { MOCK_FEED_POSTS } from "./feed-mock-data";

export function FeedMockShowcase() {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F5F5F5]">
          Exemplos de publicações
        </h2>
        <span className="rounded-full bg-[#05865E]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#05865E]">
          Mock
        </span>
      </div>
      <p className="text-xs text-[#6B7280] dark:text-[#A3A3A3]">
        Pré-visualização de formatos: texto, imagem em destaque, pomodoro e mapa
        mental.
      </p>
      <div className="space-y-4">
        {MOCK_FEED_POSTS.map((post) => (
          <FeedPostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
