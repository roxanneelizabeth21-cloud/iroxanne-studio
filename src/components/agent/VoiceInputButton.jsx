import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useVoiceInput from '@/hooks/useVoiceInput';

// Hold-free mic button: tap to start talking, tap again when you're done.
export default function VoiceInputButton({ onText, disabled, onStart }) {
  const { recording, transcribing, error, toggle } = useVoiceInput({ onText });

  const handleClick = () => {
    if (!recording) onStart?.();
    toggle();
  };

  return (
    <div className="flex flex-col items-center">
      <Button
        type="button"
        size="icon"
        variant={recording ? 'destructive' : 'outline'}
        onClick={handleClick}
        disabled={disabled || transcribing}
        aria-label={recording ? 'Stop recording' : 'Speak your message'}
      >
        {transcribing ? <Loader2 className="h-4 w-4 animate-spin" /> : recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
      {(recording || transcribing || error) && (
        <span className="mt-1 max-w-[7rem] text-center text-[10px] leading-tight text-muted-foreground">
          {error || (recording ? 'Listening… tap to stop' : 'Writing it down…')}
        </span>
      )}
    </div>
  );
}