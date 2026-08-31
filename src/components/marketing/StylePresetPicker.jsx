import { applyStylePreset } from '@/lib/marketing';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

// Dropdown next to the image prompt. Selecting a preset appends its prompt_suffix to
// the image prompt visibly, so the admin sees the final combined prompt before copying.
export default function StylePresetPicker({ presets, presetName, imagePrompt, onPresetChange, onImagePromptChange, disabled }) {
  const list = Array.isArray(presets) ? presets : [];
  if (list.length === 0) return null;

  const handleChange = (name) => {
    const preset = name ? list.find((p) => p.name === name) : null;
    const suffix = preset?.prompt_suffix || '';
    const next = applyStylePreset(imagePrompt, suffix);
    onImagePromptChange(next);
    onPresetChange(name);
  };

  return (
    <div className="flex items-center gap-2">
      <label className={FL}>Style preset</label>
      <select
        value={presetName || ''}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
        className="h-8 rounded-md border border-input bg-background px-2 text-sm flex-1 min-w-0"
      >
        <option value="">None</option>
        {list.map((p) => (
          <option key={p.name} value={p.name}>{p.name}</option>
        ))}
      </select>
    </div>
  );
}