import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const speakable = (text = '') =>
  text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*_#>`]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/https?:\/\/\S+/g, 'the link')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1200);

// Reads the strategist's newest reply out loud in a real, natural human voice
// (generated audio) rather than the phone's robotic built-in speech.
export default function useSpokenReplies(messages, enabled) {
  const [speaking, setSpeaking] = useState(false);
  const spokenRef = useRef(new Set());
  const audioRef = useRef(null);

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
  };

  useEffect(() => {
    if (!enabled) stop();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const last = [...messages].reverse().find((m) => m.role === 'assistant' && typeof m.content === 'string' && m.content.trim());
    if (!last) return;
    const key = last.id || last.content;
    if (spokenRef.current.has(key)) return;
    spokenRef.current.add(key);
    const text = speakable(last.content);
    if (!text) return;

    let cancelled = false;
    (async () => {
      setSpeaking(true);
      try {
        const { url } = await base44.integrations.Core.GenerateSpeech({ text, voice: 'honey' });
        if (cancelled || !url) return;
        stop();
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => setSpeaking(false);
        audio.onerror = () => setSpeaking(false);
        await audio.play();
      } catch {
        setSpeaking(false);
      }
    })();

    return () => { cancelled = true; };
  }, [messages, enabled]);

  useEffect(() => () => stop(), []);

  return { speaking, stop };
}