'use client';

import { useCallback, useRef, useState } from 'react';
import { FileJson, Upload, X } from 'lucide-react';

import { cn } from '@/lib/utils';

interface TelemetryUploadProps {
  onFileLoaded: (content: string, filename: string) => void;
  uploading: boolean;
  error: string | null;
  onClearError: () => void;
}

export function TelemetryUpload({
  onFileLoaded,
  uploading,
  error,
  onClearError,
}: TelemetryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      onClearError();
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onFileLoaded(reader.result, file.name);
        }
      };
      reader.readAsText(file);
    },
    [onFileLoaded, onClearError],
  );

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="surface-card rounded-card p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-aegis-accent-secondary/20 bg-aegis-accent-secondary/10">
          <FileJson className="h-4 w-4 text-aegis-accent-secondary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-aegis-text-primary">
            Telemetry Payload Upload
          </h3>
          <p className="text-xs text-aegis-text-muted">
            Batch-evaluate saved trace files (.json or .csv)
          </p>
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          'mt-4 flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center transition-colors',
          isDragging
            ? 'border-aegis-accent-primary/50 bg-aegis-accent-primary/[0.06]'
            : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.03]',
          uploading && 'pointer-events-none opacity-60',
        )}
      >
        <Upload className="h-8 w-8 text-aegis-text-muted" />
        <p className="mt-3 text-sm font-medium text-aegis-text-secondary">
          Upload Telemetry Payload (.json or .csv)
        </p>
        <p className="mt-1 text-xs text-aegis-text-muted">
          Drag and drop a saved trace file, or click to browse
        </p>
        {fileName && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] text-aegis-text-secondary">
            {fileName}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFileName(null);
              }}
              className="text-aegis-text-muted hover:text-aegis-text-primary"
            >
              <X className="h-3 w-3" />
            </button>
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".json,.csv,application/json,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {error && (
        <p className="mt-3 rounded-lg border border-aegis-danger/20 bg-aegis-danger/10 px-3 py-2 text-xs text-aegis-danger">
          {error}
        </p>
      )}
    </div>
  );
}
