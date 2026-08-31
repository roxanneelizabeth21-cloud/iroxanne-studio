import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Loader2, CheckCircle2, X, Music, Image, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';

const typeConfig = {
  image: { accept: 'image/*', icon: Image, label: 'image' },
  audio: { accept: 'audio/*', icon: Music, label: 'audio file' },
  video: { accept: 'video/*', icon: Film, label: 'video file' },
};

export default function MediaUploader({ type = 'image', onUpload, currentUrl, placeholder }) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentUrl || null);
  const inputRef = useRef(null);
  const IconComp = (typeConfig[type] || typeConfig.image).icon;
  const accept = typeConfig[type]?.accept || 'image/*';

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPreviewUrl(file_url);
    setUploading(false);
    onUpload(file_url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const clear = (e) => {
    e.stopPropagation();
    setPreviewUrl(null);
    onUpload('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      className="relative"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer
          ${previewUrl ? 'border-primary/40 bg-primary/5' : 'border-border/50 hover:border-primary/40 bg-secondary/20 hover:bg-primary/5'}
        `}
      >
        {previewUrl ? (
          <div className="p-3 flex items-center gap-3">
            {type === 'image' ? (
              <img src={previewUrl} alt="preview" className="w-16 h-16 object-cover rounded-lg" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <IconComp className="h-7 w-7 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {uploading ? 'Uploading...' : 'File uploaded'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{previewUrl}</p>
            </div>
            {uploading ? (
              <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
            ) : (
              <div className="flex items-center gap-1 shrink-0">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <button onClick={clear} className="p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            {uploading ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
            ) : (
              <IconComp className="h-8 w-8 text-muted-foreground/50 mb-2" />
            )}
            <p className="text-sm text-muted-foreground">
              {uploading ? 'Uploading...' : placeholder || `Click or drag to upload ${typeConfig[type]?.label || 'file'}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}