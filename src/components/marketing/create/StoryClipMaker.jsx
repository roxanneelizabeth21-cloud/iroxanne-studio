import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { renderStoryClip } from '@/lib/renderStoryClip';

export default function StoryClipMaker({ media, post, onAttach }) {
  const [lines, setLines] = useState(() => post?.create_post_state?.clipLines?.length === 3 ? post.create_post_state.clipLines : ['', '', '']);
  const [audioUrl, setAudioUrl] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [blob, setBlob] = useState(null);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { if (!blob) { setUrl(''); return; } const next = URL.createObjectURL(blob); setUrl(next); return () => URL.revokeObjectURL(next); }, [blob]);
  const writeLines = async () => {
    setBusy(true); setError('');
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: 'Write exactly three short on-screen beats for a 12-second iRoxanne Studio motion graphic based ONLY on this post. Each maximum 65 characters. First a specific hook, then a concrete possibility, then a warm invitation. No generic motivational slogans, fabricated claims or metrics. Exact brand spelling iRoxanne Studio. Caption: ' + (post?.caption || '') + ' Hook: ' + (post?.hook || ''),
        response_json_schema: {type:'object',properties:{lines:{type:'array',minItems:3,maxItems:3,items:{type:'string',maxLength:65}}},required:['lines']}
      });
      if (!Array.isArray(result.lines) || result.lines.length !== 3 || result.lines.some(x => typeof x !== 'string' || !x.trim() || x.length > 80)) throw new Error('Scene writing returned invalid text.');
      setLines(result.lines); setBlob(null); setAudioUrl('');
    } catch(e) {setError(e.message);} finally {setBusy(false);}
  };
  const makeVoice = async () => {
    setBusy(true); setError(''); setAudioUrl(''); setBlob(null);
    try {
      const speech = await base44.integrations.Core.GenerateSpeech({ text: lines.join(' '), voice: 'honey' });
      if (!speech?.url || !/^https:\/\//.test(speech.url)) throw new Error('Speech generation returned no audio. Your draft was not changed.');
      setAudioUrl(speech.url);
    } catch(e) { setError('Could not generate narration: ' + e.message); }
    finally { setBusy(false); }
  };
  const render = async () => {
    setBusy(true); setError(''); setBlob(null);
    try { setBlob(await renderStoryClip(media.url, lines, {onProgress:setProgress, audioUrl:voiceEnabled ? audioUrl : ''})); }
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
    <h3 className="font-medium">Create a narrated motion clip</h3>
    <p className="text-sm text-muted-foreground">Animate this graphic with three story beats and crisp, correctly spelled branding. Vertical MP4, 1080 × 1920. The clip extends to fit the narration (up to 60 seconds). Keep this tab open during export.</p>
    <Button variant="outline" disabled={busy} onClick={writeLines}>Write scene text from this post</Button>
    {lines.map((line,i) => <label className="block text-sm" key={i}>Scene {i+1}<Input value={line} maxLength={80} disabled={busy} onChange={e => {setLines(old => old.map((v,n) => n === i ? e.target.value : v));setBlob(null);setAudioUrl('');}} /></label>)}
    <label className="flex gap-2 items-center"><input type="checkbox" checked={voiceEnabled} disabled={busy} onChange={e=>{setVoiceEnabled(e.target.checked);setBlob(null);}} /> Include AI narration (Honey voice)</label>
    {voiceEnabled && <><Button variant="outline" disabled={busy || lines.some(line=>!line.trim())} onClick={makeVoice}>Generate voice preview</Button>{audioUrl&&<audio controls src={audioUrl} className="w-full" />}</>}
    <Button disabled={(voiceEnabled && !audioUrl) || busy || !media || media.type !== 'image' || lines.some(line => !line.trim())} onClick={render}>{busy ? 'Working… ' + progress + '%' : 'Create clip preview'}</Button>
    {url && <><video src={url} controls className="max-h-96 rounded-lg" /><Button disabled={busy} onClick={save}>Use this clip in my draft</Button></>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </section>;
}
