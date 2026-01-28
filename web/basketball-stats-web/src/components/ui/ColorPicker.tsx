import { TEAM_COLOR_PALETTE, isLightColor } from "@basketball-stats/shared";
import { CheckIcon } from "@heroicons/react/24/solid";

interface ColorPickerProps {
  value: string | undefined;
  onChange: (color: string) => void;
  label?: string;
  allowCustom?: boolean;
}

export function ColorPicker({ value, onChange, label, allowCustom = true }: ColorPickerProps) {
  const selectedColor = value?.toUpperCase();

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {TEAM_COLOR_PALETTE.map((color) => {
          const isSelected = selectedColor === color.hex.toUpperCase();
          const textColor = isLightColor(color.hex) ? "#000000" : "#ffffff";

          return (
            <button
              key={color.hex}
              type="button"
              onClick={() => onChange(color.hex)}
              className="relative w-8 h-8 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-surface-900"
              style={{
                backgroundColor: color.hex,
                borderColor: isSelected ? textColor : "transparent",
              }}
              title={color.name}
              aria-label={`Select ${color.name} color`}
              aria-pressed={isSelected}
            >
              {isSelected && (
                <CheckIcon
                  className="absolute inset-0 m-auto w-4 h-4"
                  style={{ color: textColor }}
                />
              )}
            </button>
          );
        })}
        {allowCustom && (
          <div className="relative">
            <input
              type="color"
              value={value || "#3B82F6"}
              onChange={(e) => onChange(e.target.value.toUpperCase())}
              className="w-8 h-8 rounded-lg cursor-pointer border-2 border-surface-300 dark:border-surface-600"
              title="Custom color"
              aria-label="Select custom color"
            />
          </div>
        )}
      </div>
      {value && (
        <div className="flex items-center gap-2 text-xs text-surface-500">
          <div
            className="w-4 h-4 rounded border border-surface-300 dark:border-surface-600"
            style={{ backgroundColor: value }}
          />
          <span className="font-mono">{value.toUpperCase()}</span>
        </div>
      )}
    </div>
  );
}
