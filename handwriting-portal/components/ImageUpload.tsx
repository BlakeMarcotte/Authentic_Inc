'use client';

import { useState } from 'react';
import { Stroke } from '@/lib/types';

interface ImageUploadProps {
  character: string;
  onComplete: (strokes: Stroke[]) => void;
  onNext: () => void;
  onPrevious?: () => void;
  hasPrevious?: boolean;
  progress: { current: number; total: number };
}

export default function ImageUpload({
  character,
  onComplete,
  onNext,
  onPrevious,
  hasPrevious,
  progress,
}: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processed, setProcessed] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, etc.)');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setProcessed(false);
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/process-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to process image');
      }

      const data = await response.json();

      const strokes: Stroke[] = data.strokes.map((stroke: any) =>
        stroke.points.map((p: any) => [p.x, p.y] as [number, number])
      );

      onComplete(strokes);
      setProcessed(true);
    } catch (err: any) {
      setError(err.message || 'Failed to process image');
      setProcessed(false);
    } finally {
      setProcessing(false);
    }
  };

  const handleNext = () => {
    if (processed) {
      onNext();
      setSelectedFile(null);
      setPreviewUrl(null);
      setProcessed(false);
      setError(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-6 bg-white rounded-2xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-medium text-gray-800">
              Character {progress.current} of {progress.total}
            </h2>
            <span className="text-3xl font-light text-gray-900">{character}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Upload Scanned Image of "{character}"
            </h3>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-all">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer block"
              >
                {previewUrl ? (
                  <div className="mb-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-96 mx-auto rounded-lg shadow-md"
                    />
                  </div>
                ) : (
                  <div className="py-12">
                    <div className="text-6xl mb-4">📄</div>
                    <p className="text-gray-600 mb-2">
                      Click to upload scanned image
                    </p>
                    <p className="text-sm text-gray-400">
                      PNG, JPG, or PDF supported
                    </p>
                  </div>
                )}
                {selectedFile && (
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedFile.name}
                  </p>
                )}
              </label>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            {hasPrevious && onPrevious && (
              <button
                onClick={onPrevious}
                className="px-8 py-3 bg-gray-500 text-white rounded-xl font-medium hover:bg-gray-600 transition-all shadow-sm"
              >
                ← Back
              </button>
            )}

            {!processed && (
              <button
                onClick={handleProcess}
                disabled={!selectedFile || processing}
                className="px-12 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all shadow-md"
              >
                {processing ? 'Processing...' : 'Process Image'}
              </button>
            )}

            {processed && (
              <button
                onClick={handleNext}
                className="px-12 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all shadow-md"
              >
                Next Character →
              </button>
            )}
          </div>

          <p className="text-center text-gray-400 text-sm mt-6 font-light">
            Upload a clear scan or photo of the character written on paper.
          </p>
        </div>
      </div>
    </div>
  );
}
