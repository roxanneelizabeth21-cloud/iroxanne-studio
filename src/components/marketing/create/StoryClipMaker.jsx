import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { renderStoryClip } from '@/lib/renderStoryClip';

export default function StoryClipMaker({ media, onAttach }) {
  const [lines, setLines] = useState(['It started with an idea.', 'What could yours become?', 'Let’s explore it together.']);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [blob, setBlob] = useState(null);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { if (!blob) { setUrl(''); return; } const next = URL.createObjectURL(blob); setUrl(next); return () => URL.revokeObjectURL(next); }, [blob]);
  const render = async () => {
    setBusy(true); setError(''); setBlob(null);
    try { setBlob(await renderStoryClip(media.url, lines, {onProgress:setProgress})); }
    catch(e) { setError(e.message); } finally { setBusy(false); }
  };
  const save = async () => {
    setBusy(true); setError('');
    try {
      const result = await base44.integrations.Core.UploadFile({file:new File([blob], 'iroxanne-studio-story.mp4', {type:'video/mp4'})});
      if (!result.file_url) throw new Error('Video upload did not return a file.');
      await onAttach(result.file_url);
    } catch(e) { setError(e.message); } finally { setBusy(false); }
  };
  return <section className="rounded-xl border border-border p-4 space-y-3">
    <h3 className="font-medium">Create a 12-second motion clip</h3>
    <p className="text-sm text-muted-foreground">Animate this graphic with three story beats and crisp, correctly spelled branding. Silent vertical MP4, 1080 × 1920. Keep this tab open during export.</p>
    {lines.map((line,i) => <label className="block text-sm" key={i}>Scene {i+1}<Input value={line} maxLength={80} disabled={busy} onChange={e => {setLines(old => old.map((v,n) => n === i ? e.target.value : v));setBlob(null);}} /></label>)}
    <Button disabled={busy || !media || media.type !== 'image' || lines.some(line => !line.trim())} onClick={render}>{busy ? 'Working… ' + progress + '%' : 'Create clip preview'}</Button>
    {url && <><video src={url} controls className="max-h-96 rounded-lg" /><Button disabled={busy} onClick={save}>Use this clip in my draft</Button></>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </section>;
}
