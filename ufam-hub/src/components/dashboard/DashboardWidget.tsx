"use client";
import { ReactNode, useState } from "react";
import { GripVertical, X, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Widget {
  id: string;
  type: string;
  title: string;
  content: ReactNode;
  size?: "small" | "medium" | "large";
  visible?: boolean;
  config?: Record<string, any>;
}

interface DashboardWidgetProps {
  widget: Widget;
  index: number;
  isDragging?: boolean;
  isEditMode?: boolean;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
  onDragEnd?: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onToggleVisibility?: (id: string) => void;
}

export function DashboardWidget({
  widget,
  index,
  isDragging = false,
  isEditMode = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onDelete,
  onEdit,
  onToggleVisibility,
}: DashboardWidgetProps) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    small: "lg:col-span-1",
    medium: "lg:col-span-2",
    large: "lg:col-span-3",
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", index.toString());
    onDragStart?.(e, index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    onDragOver?.(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedIndex = parseInt(e.dataTransfer.getData("text/html"));
    if (draggedIndex !== index) {
      onDrop?.(e, index);
    }
  };

  return (
    <div
      draggable={isEditMode}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative rounded-lg border bg-card shadow-sm transition-all duration-200",
        sizeClasses[widget.size || "medium"],
        isDragging && "opacity-50 scale-95",
        isEditMode && "cursor-move",
        !widget.visible && "opacity-40"
      )}
    >
      {/* Header do Widget */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditMode && (
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
          )}
          <h3 className="text-sm font-semibold truncate">{widget.title}</h3>
        </div>
        {isEditMode && (
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => onToggleVisibility?.(widget.id)}
              className="p-1 rounded hover:bg-accent transition-colors"
              title={widget.visible ? "Ocultar widget" : "Mostrar widget"}
            >
              <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {onDelete && (
              <button
                onClick={() => onDelete(widget.id)}
                className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Remover widget"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Conteúdo do Widget */}
      <div className="p-4">{widget.content}</div>

      {/* Overlay quando arrastando */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/5 border-2 border-primary border-dashed rounded-lg pointer-events-none" />
      )}
    </div>
  );
}
