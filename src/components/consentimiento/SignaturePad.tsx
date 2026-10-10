import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, Sparkles } from 'lucide-react';

interface SignaturePadProps {
  onSave: (base64: string) => void;
  onClear?: () => void;
  disabled?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClear, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Ajustar resolución retina
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#0f172a'; // Tinta oscura elegante
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSave('');
    if (onClear) onClear();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full h-44 rounded-2xl border-2 border-dashed border-rose-300/80 bg-rose-50/30 dark:bg-zinc-900/40 dark:border-rose-900/50 overflow-hidden touch-none shadow-inner">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {!hasSignature && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-zinc-400 gap-1.5">
            <Sparkles className="w-5 h-5 text-rose-400 animate-pulse" />
            <span className="text-xs font-medium tracking-wide">Firma aquí con tu dedo</span>
          </div>
        )}

        <div className="absolute bottom-2 left-3 pointer-events-none">
          <div className="h-0.5 w-32 bg-zinc-300 dark:bg-zinc-700/60" />
          <span className="text-[10px] text-zinc-400 font-light">Línea de firma</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400">
          {hasSignature ? '✓ Firma registrada en pantalla' : 'Por favor dibuja tu trazo arriba'}
        </span>
        <button
          type="button"
          onClick={clearCanvas}
          disabled={!hasSignature || disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 disabled:opacity-40 transition-colors"
        >
          <Eraser className="w-3.5 h-3.5" />
          Borrar firma
        </button>
      </div>
    </div>
  );
};
