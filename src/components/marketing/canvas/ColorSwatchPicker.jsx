// Background colour picker for the promo card — a row of swatches pulled from
// the cover image, one selected.
export default function ColorSwatchPicker({ colors = [], value, onPick }) {
  return (
    <div className="grid grid-cols-5 gap-2 max-w-[240px]" role="radiogroup" aria-label="Background colour">
      {colors.map((hex) => {
        const on = String(value).toLowerCase() === String(hex).toLowerCase();
        return (
          <button
            key={hex}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`Background colour ${hex}`}
            onClick={() => onPick(hex)}
            className={`h-9 w-9 rounded-full border-2 ${on ? 'border-primary ring-2 ring-primary/30' : 'border-border/60'}`}
            style={{ backgroundColor: hex }}
          />
        );
      })}
    </div>
  );
}