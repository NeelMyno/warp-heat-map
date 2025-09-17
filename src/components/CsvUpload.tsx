import React, { useRef, useState } from 'react';

interface CsvUploadProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

export function CsvUpload({ onFileUpload, isLoading }: CsvUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.csv')) {
        onFileUpload(file);
      } else {
        alert('Please upload a CSV file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3 w-full">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 rounded bg-[#111] border border-[#333] hover:bg-[#222] transition-all"
      >
        <span className="text-[#ccc] text-xs">CSV Upload</span>
        <span className={`text-[#888] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="space-y-3 w-full">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-3 text-center transition-all cursor-pointer w-full
              ${dragActive
                ? 'border-[#00ff33] bg-[#001100]'
                : 'border-[#333] hover:border-[#555] hover:bg-[#111]'
              }
              ${isLoading ? 'opacity-50 pointer-events-none' : ''}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
            />

            <div className="space-y-1">
              <svg
                className="mx-auto h-6 w-6 text-[#666]"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="text-[#ccc]">
                <p className="text-xs font-medium">
                  {isLoading ? 'Processing...' : 'Upload CSV'}
                </p>
                <p className="text-xs text-[#888]">
                  Click or drag file
                </p>
              </div>
            </div>
          </div>

      {/* Format Information */}
      <div className="bg-[#111] border border-[#333] rounded-lg p-4">
        <h3 className="text-sm font-medium text-[#ccc] mb-2">Expected CSV Format</h3>
        <div className="text-xs text-[#888] space-y-1">
          <p>Your CSV file should contain the following columns:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li><strong>name/company</strong>: Company or customer name</li>
            <li><strong>origin</strong>: Origin ZIP code (5 digits)</li>
            <li><strong>destination</strong>: Destination ZIP code (5 digits)</li>
          </ul>
          <p className="mt-2 text-[#666]">
            Column names are flexible - the system will automatically detect variations like 
            "Company Name", "origin_zip", "dest", etc.
          </p>
        </div>
      </div>

      {/* Sample Data Preview */}
      <div className="bg-[#111] border border-[#333] rounded-lg p-4">
        <h3 className="text-sm font-medium text-[#ccc] mb-2">Sample Data Format</h3>
        <div className="bg-[#0a0a0a] border border-[#222] rounded p-3 text-xs font-mono">
          <div className="text-[#888] mb-1">name,origin,destination</div>
          <div className="text-[#ccc]">Consultant,60035,77479</div>
          <div className="text-[#ccc]">Doersbiz.com,8901,28610</div>
          <div className="text-[#ccc]">Upward Projects,85012,78704</div>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}
