'use client';

import { useState } from 'react';

interface TextCaptureProps {
  title: string;
  prompt: string;
  placeholder: string;
  onComplete: (text: string) => void;
  onPrevious?: () => void;
}

export default function TextCapture({
  title,
  prompt,
  placeholder,
  onComplete,
  onPrevious,
}: TextCaptureProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onComplete(text);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-lg p-6 md:p-8 border border-gray-200">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 mb-6 font-light">{prompt}</p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="w-full h-64 p-4 border border-gray-300 rounded-2xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none resize-none text-lg shadow-sm text-gray-900 placeholder:text-gray-400"
          style={{ fontFamily: 'inherit' }}
        />

        <div className="flex gap-3 justify-center mt-6">
          {onPrevious && (
            <button
              onClick={onPrevious}
              className="px-8 py-3 bg-black-400 text-white rounded-xl font-medium hover:bg-black-500 transition-all shadow-sm"
            >
              ← Previous
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="px-8 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all flex-1 shadow-sm"
          >
            Complete →
          </button>
        </div>
      </div>
    </div>
  );
}
