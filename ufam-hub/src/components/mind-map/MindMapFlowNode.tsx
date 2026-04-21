"use client";

import { memo } from "react";
import { type Node, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { MindMapFlowNodeData } from "@/lib/mind-map/flow-layout";

function MindMapFlowNodeInner({
  data,
}: NodeProps<Node<MindMapFlowNodeData>>) {
  const isRoot = data.kind === "root";

  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-[#121212] px-3 py-2.5 shadow-lg transition-[box-shadow,transform] duration-200",
        "border-[#2a2a2a]",
        data.selected &&
          "ring-2 ring-[#05865E]/70 ring-offset-2 ring-offset-[#050505]",
        isRoot && "px-4 py-3"
      )}
      style={{
        borderColor: data.selected ? "#05865E" : `${data.color}55`,
        minWidth: isRoot ? 200 : data.kind === "ramo" ? 200 : 168,
        maxWidth: isRoot ? 280 : data.kind === "ramo" ? 280 : 240,
      }}
    >
      <div className="min-w-0">
        <p
          className={cn(
            "font-semibold leading-snug text-[#F5F5F5]",
            isRoot ? "text-center text-base" : "text-sm"
          )}
          style={{ color: isRoot ? "#fafafa" : data.color }}
        >
          {data.label}
        </p>
        {data.subtitle ? (
          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[#A3A3A3]">
            {data.subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export const MindMapFlowNode = memo(MindMapFlowNodeInner);
