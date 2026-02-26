import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Paintbrush } from "lucide-react";
import { useUpdateProjectColors } from "@/hooks/use-project-colors";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#0000FF", "#0066FF", "#00CCFF", "#660099", "#9933FF",
  "#CC0000", "#FF3333", "#FF6600", "#FF9933", "#FFA500",
  "#006633", "#00CC66", "#84D71A", "#FF44CC", "#FF0040",
  "#333333", "#666666", "#999999",
];

interface ProjectColorPickerProps {
  projectSlug: string;
  colorPrimary: string | null;
  colorAccent: string | null;
  colorBackground?: string | null;
  className?: string;
}

export function ProjectColorPicker({
  projectSlug,
  colorPrimary,
  colorAccent,
  colorBackground,
  className,
}: ProjectColorPickerProps) {
  const [primary, setPrimary] = useState(colorPrimary || "#0000FF");
  const [accent, setAccent] = useState(colorAccent || "#FF44CC");
  const [background, setBackground] = useState(colorBackground || "");
  const updateColors = useUpdateProjectColors();

  const handleSave = () => {
    updateColors.mutate({
      idOrSlug: projectSlug,
      colors: {
        colorPrimary: primary,
        colorAccent: accent,
        colorBackground: background || null,
      },
    });
  };

  const isDirty =
    primary !== (colorPrimary || "#0000FF") ||
    accent !== (colorAccent || "#FF44CC") ||
    background !== (colorBackground || "");

  return (
    <div className={cn("space-y-4", className)}>
      {/* Primary Color */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Primary Color</Label>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-gray-400 transition-colors"
                style={{ backgroundColor: primary }}
              />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3">
              <div className="grid grid-cols-6 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-8 h-8 rounded-md border-2 cursor-pointer hover:scale-110 transition-transform",
                      primary === color ? "border-black" : "border-transparent",
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setPrimary(color)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Input
            type="text"
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            className="w-28 font-mono text-sm"
            maxLength={7}
          />
        </div>
      </div>

      {/* Accent Color */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Accent Color</Label>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-gray-400 transition-colors"
                style={{ backgroundColor: accent }}
              />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3">
              <div className="grid grid-cols-6 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-8 h-8 rounded-md border-2 cursor-pointer hover:scale-110 transition-transform",
                      accent === color ? "border-black" : "border-transparent",
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setAccent(color)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Input
            type="text"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="w-28 font-mono text-sm"
            maxLength={7}
          />
        </div>
      </div>

      {/* Background Color */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Background Color (optional)</Label>
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-lg border-2 border-gray-200"
            style={{
              backgroundColor: background || `${primary}10`,
            }}
          />
          <Input
            type="text"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            placeholder="#FFFFFF"
            className="w-28 font-mono text-sm"
            maxLength={7}
          />
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 rounded-lg border" style={{ backgroundColor: background || `${primary}08` }}>
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-8 rounded-full"
            style={{ backgroundColor: primary }}
          />
          <div>
            <div className="text-sm font-semibold" style={{ color: primary }}>
              Primary Text
            </div>
            <div className="text-xs" style={{ color: accent }}>
              Accent Text
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={!isDirty || updateColors.isPending}
        className="w-full"
        size="sm"
      >
        {updateColors.isPending ? "Saving..." : "Save Colors"}
      </Button>
    </div>
  );
}
