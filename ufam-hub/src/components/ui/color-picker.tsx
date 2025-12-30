"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CORES_DISCIPLINAS } from "@/hooks/useDisciplinas";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
  trigger?: React.ReactNode;
}

export function ColorPicker({
  value,
  onChange,
  className,
  trigger,
}: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [customColor, setCustomColor] = React.useState(value);

  React.useEffect(() => {
    setCustomColor(value);
  }, [value]);

  const handleColorChange = (color: string) => {
    onChange(color);
    setCustomColor(color);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", className)}
          >
            <Palette className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          {/* Color Picker HTML5 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Cor Personalizada</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={customColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="h-10 w-20 cursor-pointer border-0 p-0"
              />
              <Input
                type="text"
                value={customColor}
                onChange={(e) => {
                  const newColor = e.target.value;
                  setCustomColor(newColor);
                  if (/^#[0-9A-F]{6}$/i.test(newColor)) {
                    handleColorChange(newColor);
                  }
                }}
                placeholder="#000000"
                className="flex-1 font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>

          {/* Cores Predefinidas */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Cores Predefinidas</Label>
            <div className="grid grid-cols-8 gap-2 max-h-[200px] overflow-y-auto">
              {CORES_DISCIPLINAS.map((c) => (
                <button
                  key={c.valor}
                  onClick={() => handleColorChange(c.valor)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all hover:scale-110",
                    value === c.valor
                      ? "border-foreground ring-2 ring-offset-2 ring-primary scale-110"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: c.valor }}
                  title={c.nome}
                >
                  {value === c.valor && (
                    <Check className="h-4 w-4 text-white mx-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Preview</Label>
            <div
              className="h-12 w-full rounded-lg border-2 border-border"
              style={{ backgroundColor: customColor }}
            />
            <p className="text-xs text-muted-foreground font-mono text-center">
              {customColor.toUpperCase()}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
