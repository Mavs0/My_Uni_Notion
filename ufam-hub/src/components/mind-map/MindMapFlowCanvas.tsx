"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { MapaMentalData } from "@/types/mind-map";
import {
  MM_FLOW_ROOT_ID,
  mapDataToMindMapFlow,
  type MindMapFlowNodeData,
} from "@/lib/mind-map/flow-layout";
import { MindMapFlowNode } from "./MindMapFlowNode";
import { cn } from "@/lib/utils";

const nodeTypes: NodeTypes = {
  mindMap: MindMapFlowNode,
};

type Props = {
  data: MapaMentalData;
  selectedRamoId: string | null;
  onSelectRamo: (id: string) => void;
  onOpenRamoPanel: (id: string) => void;
  className?: string;
};

function MindMapFlowCanvasInner({
  data,
  selectedRamoId,
  onSelectRamo,
  onOpenRamoPanel,
  className,
}: Props) {
  const { fitView } = useReactFlow();
  const { nodes: seedNodes, edges: seedEdges } = useMemo(
    () => mapDataToMindMapFlow(data, selectedRamoId),
    [data, selectedRamoId]
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(seedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(seedEdges);

  useEffect(() => {
    const { nodes: n, edges: e } = mapDataToMindMapFlow(data, selectedRamoId);
    setNodes(n);
    setEdges(e);
    const t = window.setTimeout(() => {
      fitView({
        padding: 0.2,
        duration: 320,
        maxZoom: 1.45,
        minZoom: 0.22,
      });
    }, 48);
    return () => window.clearTimeout(t);
  }, [data, selectedRamoId, fitView, setEdges, setNodes]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<MindMapFlowNodeData>) => {
      if (node.id === MM_FLOW_ROOT_ID) return;
      const d = node.data;
      const rid = d.kind === "sub" ? d.ramoId : node.id;
      if (!rid) return;
      onSelectRamo(rid);
      onOpenRamoPanel(rid);
    },
    [onOpenRamoPanel, onSelectRamo]
  );

  return (
    <div
      className={cn(
        "h-[min(70vh,640px)] min-h-[360px] w-full overflow-hidden rounded-2xl border border-[#262626] bg-[#050505]",
        "[&_.react-flow\_\_attribution]:bg-[#151515] [&_.react-flow\_\_attribution]:text-[10px] [&_.react-flow\_\_attribution]:text-[#737373]",
        className
      )}
    >
      <ReactFlow
        colorMode="dark"
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        zoomOnScroll
        minZoom={0.15}
        maxZoom={1.65}
        fitView
        className="!bg-[#050505] [&_.react-flow__edge-path]:!stroke-opacity-100"
        defaultEdgeOptions={{
          type: "default",
          style: { strokeWidth: 2.5 },
        }}
      >
        <Background color="#2a2a2a" gap={22} size={1} />
        <Controls
          showInteractive={false}
          className="!m-2 !overflow-hidden !rounded-xl !border !border-[#333] !bg-[#121212] !shadow-xl [&_button]:!h-8 [&_button]:!w-8 [&_button]:!border-[#262626] [&_button]:!bg-[#151515] [&_button]:!fill-[#d4d4d4] [&_button:hover]:!bg-[#1f1f1f]"
        />
      </ReactFlow>
    </div>
  );
}

export function MindMapFlowCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <MindMapFlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
