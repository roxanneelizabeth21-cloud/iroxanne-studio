import { useState } from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { dateKey } from '@/lib/marketing';

const pretty = (v) => {
  if (!v) return '';
  const d = new Date(`${v}T00:00:00`);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

// One tap-friendly date control used everywhere a date is picked: a real
// month calendar instead of a raw native date box.
export default function DateField({
  value, onChange, id, disabled, placeholder = 'Pick a date', clearable = true, className = '',
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={`flex-1 justify-start gap-2 font-normal ${value ? '' : 'text-muted-foreground'}`}
          >
            <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{value ? pretty(value) : placeholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(d) => { if (d) { onChange(dateKey(d)); setOpen(false); } }}
          />
        </PopoverContent>
      </Popover>
      {clearable && value && !disabled && (
        <Button type="button" variant="ghost" size="icon" onClick={() => onChange('')} aria-label="Clear date">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}