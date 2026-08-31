import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Replace, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// ReplaceAudioButton — upload a new audio file and overwrite the audio_file
// currently attached to a song. Lets the admin fix a wrong attachment without
// opening the full edit form.
export default function ReplaceAudioButton({ profileId, onDone }) {
  const { toast } = useToast();
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/\.(mp3|m4a|wav|aac|ogg|flac)$/i.test(file.name) && !file.type.startsWith('audio/')) {
      toast({ title: 'Please pick an audio file', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.SongProfile.update(profileId, { audio_file: file_url });
      toast({ title: 'Audio replaced' });
      onDone?.();
    } catch (err) {
      toast({ title: 'Replace failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg,.flac"
        className="hidden"
        onChange={pick}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => ref.current?.click()}
        className="gap-1.5"
        title="Upload a new audio file to replace the current one"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Replace className="h-3.5 w-3.5" />}
        Replace audio
      </Button>
    </>
  );
}