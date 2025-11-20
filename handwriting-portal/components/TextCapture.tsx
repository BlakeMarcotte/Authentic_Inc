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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{prompt}</p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="w-full h-64 p-4 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none resize-none text-lg"
          style={{ fontFamily: 'inherit' }}
        />

        <div className="flex gap-3 justify-center mt-6">
          {onPrevious && (
            <button
              onClick={onPrevious}
              className="px-8 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              ← Previous
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-1"
          >
            Complete →
          </button>
        </div>
      </div>
    </div>
  );
}
