'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { formatFileSize } from '@/lib/csvParser';

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export default function DropZone({ onFileSelected, disabled }: DropZoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
    maxFiles: 1,
    disabled,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`dropzone${isDragActive ? ' drag-active' : ''}`}
        style={{ opacity: disabled ? 0.6 : 1 }}
      >
        <input {...getInputProps()} id="csv-file-input" />
        <span className="dropzone-icon">
          {isDragActive ? '📂' : '📁'}
        </span>
        <p className="dropzone-title">
          {isDragActive ? 'Drop your CSV here' : 'Drag & drop your CSV file'}
        </p>
        <p className="dropzone-subtitle">
          Supports any CSV format — Facebook Ads, Google Ads, Real Estate, Sales reports, and more
        </p>
        <div className="dropzone-or">or</div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={(e) => {
            e.stopPropagation();
            (document.getElementById('csv-file-input') as HTMLInputElement)?.click();
          }}
          disabled={disabled}
        >
          📄 Browse File
        </button>
      </div>

      {selectedFile && (
        <div className="file-info fade-in">
          <span className="file-info-icon">✅</span>
          <div>
            <div className="file-info-name">{selectedFile.name}</div>
            <div className="file-info-meta">
              {formatFileSize(selectedFile.size)} · CSV File
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
