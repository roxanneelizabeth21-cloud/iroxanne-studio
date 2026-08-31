import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';

// Records the owner's voice, then turns it into text.
// Recording + transcription is used instead of the browser's own dictation
// because that only works in some browsers and stops after a short pause.
export default function useVoiceInput({ onText }) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState('');
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const start = async () => {
    setError('');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      if (blob.size < 1000) return;
      setTranscribing(true);
      try {
        const ext = (recorder.mimeType || '').includes('mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `voice-note.${ext}`, { type: blob.type });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const text = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
        const clean = typeof text === 'string' ? text.trim() : '';
        if (clean) onText(clean);
        else setError('I could not make out any words there.');
      } catch (e) {
        setError(e.message || 'Could not turn that into text.');
      } finally {
        setTranscribing(false);
      }
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
  };

  const stop = () => recorderRef.current?.stop();

  const toggle = async () => {
    if (recording) return stop();
    try {
      await start();
    } catch {
      setError('I need permission to use your microphone.');
    }
  };

  return { recording, transcribing, error, toggle };
}