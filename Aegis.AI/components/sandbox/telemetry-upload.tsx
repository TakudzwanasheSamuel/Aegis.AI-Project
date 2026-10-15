'use client';

import { useCallback, useRef, useState } from 'react';
import { FileJson, Upload, X } from 'lucide-react';

import { Notice, Panel } from '@/components/ui-aegis';
import { cn } from '@/lib/utils';

interface TelemetryUploadProps {
  onFileLoaded: (content: string, filename: string) => void;
  uploading: boolean;
  error: string | null;
  onClearError: () => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const [fileSize, setFileSize] = useState<number | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      onClearError();
      setFileName(file.name);
      setFileSize(file.size);
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
    <Panel
      title={
        <span className="flex items-center gap-2">
          <FileJson className="h-4 w-4 text-aegis-muted" aria-hidden="true" />
          Telemetry Payload Upload
        </span>
      }
      description="Batch-evaluate saved trace files (.json or .csv)"
    >
      <div
        role="button"
        tabIndex={0}
        aria-busy={uploading}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-6 py-8 text-center transition-colors',
          isDragging
            ? 'border-solid border-aegis-accent bg-aegis-accent/[0.06]'
            : 'border-aegis-rule bg-aegis-paper hover:border-aegis-muted/60',
          uploading && 'pointer-events-none opacity-60',
        )}
      >
        <Upload className={cn('h-7 w-7', isDragging ? 'text-aegis-accent' : 'text-aegis-muted')} aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-aegis-ink">
          Upload Telemetry Payload (.json or .csv)
        </p>
        <p className="mt-1 text-sm text-aegis-muted">
          Drag and drop a saved trace file, or click to browse
        </p>
        {fileName && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-md border border-aegis-rule bg-aegis-surface py-1 pl-3 pr-1 text-xs text-aegis-ink-2">
            <span className="font-mono">{fileName}</span>
            {fileSize != null && (
              <span className="font-mono tabular-nums text-aegis-muted">{formatSize(fileSize)}</span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFileName(null);
                setFileSize(null);
              }}
              className="flex h-6 w-6 items-center justify-center rounded-sm text-aegis-muted hover:bg-aegis-sunken hover:text-aegis-ink"
              aria-label="Clear selected file"
            >
              <X className="h-3.5 w-3.5" />
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

      {error && <Notice className="mt-3">{error}</Notice>}
    </Panel>
  );
}
