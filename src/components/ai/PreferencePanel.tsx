import { Badge, Input } from '@/components/vui';
import { FRAME_SHAPES, FRAME_SHAPE_LABEL, FACE_SHAPE_LABEL } from '@/services/ai';
import { FACE_SHAPES } from '@/types';
import { cx, formatMoney } from '@/lib/utils';
import type { FaceShape, FrameShape, StylePreferences } from '@/types';

export interface PreferencePanelProps {
  preferences: StylePreferences;
  onChange: (next: StylePreferences) => void;
  manualFaceShape: FaceShape | null;
  onManualFaceShapeChange: (shape: FaceShape | null) => void;
  disabled?: boolean;
}

const COLOR_OPTIONS = [
  'black',
  'matte black',
  'tortoise',
  'crystal',
  'gold',
  'silver',
  'havana',
  'rose',
  'navy',
  'olive',
];

function Chip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cx(
        'rounded-full border px-3.5 py-1.5 text-sm transition-colors disabled:opacity-50',
        active
          ? 'border-primary-600 bg-primary-600 text-white'
          : 'border-ink-300 bg-white text-ink-700 hover:bg-ink-50',
      )}
    >
      {children}
    </button>
  );
}

export function PreferencePanel({
  preferences,
  onChange,
  manualFaceShape,
  onManualFaceShapeChange,
  disabled = false,
}: PreferencePanelProps) {
  const toggleShape = (shape: FrameShape) => {
    const next = preferences.frameShapes.includes(shape)
      ? preferences.frameShapes.filter((item) => item !== shape)
      : [...preferences.frameShapes, shape];
    onChange({ ...preferences, frameShapes: next });
  };

  const toggleColor = (color: string) => {
    const next = preferences.colors.includes(color)
      ? preferences.colors.filter((item) => item !== color)
      : [...preferences.colors, color];
    onChange({ ...preferences, colors: next });
  };

  return (
    <div className="space-y-7">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-ink-900">Frame shape</h3>
          <Badge variant="neutral">Optional</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {FRAME_SHAPES.map((shape) => (
            <Chip
              key={shape}
              active={preferences.frameShapes.includes(shape)}
              disabled={disabled}
              onClick={() => toggleShape(shape)}
            >
              {FRAME_SHAPE_LABEL[shape]}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-ink-900">Colour preference</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((color) => (
            <Chip
              key={color}
              active={preferences.colors.includes(color)}
              disabled={disabled}
              onClick={() => toggleColor(color)}
            >
              <span className="capitalize">{color}</span>
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-900">Budget</h3>
          <span className="text-sm text-ink-600">
            {formatMoney(preferences.minPriceCents)} – {formatMoney(preferences.maxPriceCents)}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-xs text-ink-500">
            Minimum
            <input
              type="range"
              min={0}
              max={50000}
              step={1000}
              disabled={disabled}
              value={preferences.minPriceCents}
              onChange={(event) =>
                onChange({
                  ...preferences,
                  minPriceCents: Math.min(Number(event.target.value), preferences.maxPriceCents),
                })
              }
              className="mt-2 w-full accent-[var(--color-primary-600)]"
            />
          </label>
          <label className="text-xs text-ink-500">
            Maximum
            <input
              type="range"
              min={0}
              max={50000}
              step={1000}
              disabled={disabled}
              value={preferences.maxPriceCents}
              onChange={(event) =>
                onChange({
                  ...preferences,
                  maxPriceCents: Math.max(Number(event.target.value), preferences.minPriceCents),
                })
              }
              className="mt-2 w-full accent-[var(--color-primary-600)]"
            />
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-ink-900">Style notes</h3>
        <Input
          className="mt-3"
          placeholder="e.g. lightweight metal frames for the office"
          value={preferences.notes}
          disabled={disabled}
          onChange={(event) => onChange({ ...preferences, notes: event.target.value })}
        />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-ink-900">No photo?</h3>
          <Badge variant="neutral">Pick your face shape</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {FACE_SHAPES.map((shape) => (
            <Chip
              key={shape}
              active={manualFaceShape === shape}
              disabled={disabled}
              onClick={() => onManualFaceShapeChange(manualFaceShape === shape ? null : shape)}
            >
              {FACE_SHAPE_LABEL[shape]}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}