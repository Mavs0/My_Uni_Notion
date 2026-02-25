"use client";
import { useState, useCallback } from "react";
import { DashboardWidget } from "./DashboardWidget";
import type { Widget } from "./DashboardWidget";
import { Button } from "@/components/ui/button";
import { Settings2, Check, Plus } from "lucide-react";

interface WidgetGridProps {
  widgets: Widget[];
  onReorder: (newOrder: Widget[]) => void;
  onDelete?: (id: string) => void;
  onToggleVisibility?: (id: string) => void;
  onAddWidget?: () => void;
  availableWidgets?: Array<{ type: string; title: string; description: string }>;
}

export function WidgetGrid({
  widgets,
  onReorder,
  onDelete,
  onToggleVisibility,
  onAddWidget,
  availableWidgets,
}: WidgetGridProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      const draggedIndex = parseInt(e.dataTransfer.getData("text/html"));

      if (draggedIndex !== dropIndex && draggedIndex !== null) {
        const newWidgets = [...widgets];
        const [draggedWidget] = newWidgets.splice(draggedIndex, 1);
        newWidgets.splice(dropIndex, 0, draggedWidget);
        onReorder(newWidgets);
      }

      setDraggedIndex(null);
      setDragOverIndex(null);
    },
    [widgets, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const widgetsToShow = isEditMode
    ? widgets
    : widgets.filter((w) => w.visible !== false);

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Dashboard Personalizado</h2>
        <div className="flex items-center gap-2">
          {isEditMode && onAddWidget && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddWidget}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Widget
            </Button>
          )}
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className="gap-2"
          >
            {isEditMode ? (
              <>
                <Check className="h-4 w-4" />
                Concluir
              </>
            ) : (
              <>
                <Settings2 className="h-4 w-4" />
                Personalizar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Grid de Widgets */}
      {widgetsToShow.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgetsToShow.map((widget, index) => {
            const originalIndex = widgets.findIndex((w) => w.id === widget.id);
            return (
              <DashboardWidget
                key={widget.id}
                widget={widget}
                index={originalIndex}
                isDragging={draggedIndex === originalIndex}
                isEditMode={isEditMode}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onDelete={onDelete}
                onToggleVisibility={onToggleVisibility}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg p-8">
          {isEditMode ? (
            <div className="space-y-3">
              <p className="font-medium">Nenhum widget adicionado ainda</p>
              <p className="text-sm">
                Clique em "Adicionar Widget" para começar a personalizar seu dashboard
              </p>
              {onAddWidget && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddWidget}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Widget
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="font-medium">Nenhum widget visível</p>
              <p className="text-sm">
                Clique em "Personalizar" para adicionar e configurar widgets
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
