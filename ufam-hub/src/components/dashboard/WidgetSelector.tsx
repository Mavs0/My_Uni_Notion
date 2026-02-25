"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Widget } from "./DashboardWidget";

interface WidgetOption {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  size: "small" | "medium" | "large";
  category: string;
}

interface WidgetSelectorProps {
  availableWidgets: WidgetOption[];
  currentWidgets: Widget[];
  onAddWidget: (widgetType: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WidgetSelector({
  availableWidgets,
  currentWidgets,
  onAddWidget,
  open,
  onOpenChange,
}: WidgetSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(
    new Set(availableWidgets.map((w) => w.category))
  );

  const addedWidgetTypes = new Set(currentWidgets.map((w) => w.type));

  const filteredWidgets = selectedCategory
    ? availableWidgets.filter((w) => w.category === selectedCategory)
    : availableWidgets;

  const widgetsToShow = filteredWidgets.filter(
    (w) => !addedWidgetTypes.has(w.type)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Adicionar Widgets</DialogTitle>
          <DialogDescription>
            Escolha os widgets que deseja adicionar ao seu dashboard
          </DialogDescription>
        </DialogHeader>

        {/* Filtros por categoria */}
        <div className="flex flex-wrap gap-2 pb-4 border-b">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Todos
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Lista de widgets */}
        <div className="flex-1 overflow-y-auto">
          {widgetsToShow.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>
                {addedWidgetTypes.size === availableWidgets.length
                  ? "Todos os widgets já foram adicionados"
                  : "Nenhum widget encontrado nesta categoria"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {widgetsToShow.map((widget) => (
                <div
                  key={widget.type}
                  className="flex items-start gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {widget.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm">{widget.title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {widget.size}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {widget.description}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        onAddWidget(widget.type);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Widgets já adicionados (se houver) */}
        {addedWidgetTypes.size > 0 && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              Widgets já adicionados ({addedWidgetTypes.size}):
            </p>
            <div className="flex flex-wrap gap-2">
              {availableWidgets
                .filter((w) => addedWidgetTypes.has(w.type))
                .map((widget) => (
                  <Badge key={widget.type} variant="secondary" className="text-xs">
                    {widget.title}
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
