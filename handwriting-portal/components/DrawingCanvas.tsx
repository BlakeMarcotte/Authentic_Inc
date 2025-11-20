'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Stroke, NormalizedPoint } from '@/lib/types';

interface DrawingCanvasProps {
  onComplete: (strokes: Stroke[]) => void;
  character: string;
  onNext: () => void;
  onPrevious?: () => void;
  hasPrevious?: boolean;
  progress: { current: number; total: number };
}

export default function DrawingCanvas({
  onComplete,
  character,
  onNext,
  onPrevious,
  hasPrevious,
  progress,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<NormalizedPoint[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const width = Math.min(container.clientWidth, 1077);
      const height = 600;
      setCanvasSize({ width, height });

      canvas.width = width;
      canvas.height = height;

      redrawAllStrokes();
    };

    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    canvas.addEventListener('touchstart', preventScroll, { passive: false });
    canvas.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      canvas.removeEventListener('touchstart', preventScroll);
      canvas.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  const redrawAllStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    const centerX = w / 2;
    const baselineY = h * 0.60;

    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    ctx.strokeStyle = '#d1d5db';
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, h);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, h);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(0, h);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, baselineY);
    ctx.lineTo(w, baselineY);
    ctx.stroke();

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1f2937';

    strokes.forEach((stroke) => {
      if (stroke.length === 0) return;

      ctx.beginPath();
      const [startX, startY] = stroke[0];
      ctx.moveTo(startX * canvas.width, startY * canvas.height);

      for (let i = 1; i < stroke.length; i++) {
        const [x, y] = stroke[i];
        ctx.lineTo(x * canvas.width, y * canvas.height);
      }
      ctx.stroke();
    });
  }, [strokes]);

  useEffect(() => {
    redrawAllStrokes();
  }, [strokes, canvasSize, redrawAllStrokes]);

  const getPointFromEvent = (e: React.MouseEvent | React.TouchEvent): NormalizedPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    return [Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y))];
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const point = getPointFromEvent(e);
    if (!point) return;

    setIsDrawing(true);
    setCurrentStroke([point]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const point = getPointFromEvent(e);
    if (!point) return;

    setCurrentStroke((prev) => {
      const newStroke = [...prev, point];

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx && prev.length > 0) {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#1f2937';
          ctx.beginPath();
          const [prevX, prevY] = prev[prev.length - 1];
          ctx.moveTo(prevX * canvas.width, prevY * canvas.height);
          ctx.lineTo(point[0] * canvas.width, point[1] * canvas.height);
          ctx.stroke();
        }
      }

      return newStroke;
    });
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStroke.length > 0) {
      setStrokes((prev) => [...prev, currentStroke]);
      setCurrentStroke([]);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    setStrokes([]);
    setCurrentStroke([]);
  };

  const undoLastStroke = () => {
    setStrokes((prev) => prev.slice(0, -1));
  };

  const handleNext = () => {
    onComplete(strokes);
    onNext();
    clearCanvas();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4">
      <div className="w-full max-w-6xl">
        <div className="mb-6 bg-white rounded-2xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-medium text-gray-800">Character {progress.current} of {progress.total}</h2>
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
          <div className="flex justify-center mb-6">
            <canvas
              ref={canvasRef}
              className="border-2 border-gray-300 rounded-xl cursor-crosshair touch-none bg-white shadow-inner"
              style={{ width: '100%', maxWidth: '900px', height: 'auto' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={endDrawing}
              onMouseLeave={endDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={endDrawing}
            />
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={undoLastStroke}
              disabled={strokes.length === 0}
              className="px-8 py-3 bg-amber-400 text-white rounded-xl font-medium hover:bg-amber-500 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              ↶ Undo
            </button>
            <button
              onClick={clearCanvas}
              disabled={strokes.length === 0}
              className="px-8 py-3 bg-rose-400 text-white rounded-xl font-medium hover:bg-rose-500 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              ✕ Clear
            </button>
            {hasPrevious && onPrevious && (
              <button
                onClick={onPrevious}
                className="px-8 py-3 bg-gray-500 text-white rounded-xl font-medium hover:bg-gray-600 transition-all shadow-sm"
              >
                ← Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={strokes.length === 0}
              className="px-12 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all shadow-md"
            >
              Next Character →
            </button>
          </div>

          <p className="text-center text-gray-400 text-sm mt-6 font-light">
            Draw the character naturally. The solid line is your baseline — feel free to go above or below it.
          </p>
        </div>
      </div>
    </div>
  );
}
