'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Eraser, PenTool, Sparkles } from 'lucide-react';

export interface SignaturePadProps {
  label: string;
  signerName?: string;
  sublabel?: string;
  value: string;
  onChange: (dataUrl: string) => void;
  error?: string;
  disabled?: boolean;
}

export function SignaturePad({
  label,
  signerName,
  sublabel,
  value,
  onChange,
  error,
  disabled = false,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState<boolean>(Boolean(value));

  useEffect(() => {
    setHasStrokes(Boolean(value));
  }, [value]);

  const getCoordinates = (
    event: React.PointerEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    canvas.setPointerCapture(event.pointerId);
    const { x, y } = getCoordinates(event);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = event.pointerType === 'pen' ? 2.8 : 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getCoordinates(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const finishDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setHasStrokes(true);
    onChange(dataUrl);
  };

  const handleClear = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasStrokes(false);
    onChange('');
  };

  const handleApplyQuickTouchSignature = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(35, 85);
    ctx.bezierCurveTo(75, 25, 115, 105, 160, 48);
    ctx.bezierCurveTo(195, 18, 225, 90, 275, 54);
    ctx.bezierCurveTo(310, 32, 355, 78, 420, 42);
    ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = 1.4;
    ctx.moveTo(55, 96);
    ctx.quadraticCurveTo(210, 76, 390, 92);
    ctx.stroke();

    if (signerName) {
      ctx.font = 'italic 13px Georgia, serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(signerName.slice(0, 36), 40, 114);
    }

    const dataUrl = canvas.toDataURL('image/png');
    setHasStrokes(true);
    onChange(dataUrl);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <PenTool className="h-4 w-4 text-blue-600" />
            {label}
          </label>
          {sublabel && <p className="text-xs text-slate-500">{sublabel}</p>}
        </div>

        <div className="flex items-center gap-1.5">
          {!disabled && (
            <>
              <button
                type="button"
                onClick={handleApplyQuickTouchSignature}
                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                title="Simular trazo biométrico rápido"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Trazo Rápido
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <Eraser className="h-3.5 w-3.5" />
                Limpiar
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className={`relative overflow-hidden rounded-lg border-2 border-dashed transition ${
          error
            ? 'border-red-400 bg-red-50/30'
            : hasStrokes
              ? 'border-emerald-400 bg-emerald-50/10'
              : 'border-slate-300 bg-slate-50/70'
        }`}
      >
        <canvas
          ref={canvasRef}
          width={480}
          height={130}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrawing}
          onPointerCancel={finishDrawing}
          onPointerLeave={finishDrawing}
          className="h-32 w-full cursor-crosshair touch-none select-none"
        />

        {!hasStrokes && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center text-xs text-slate-400">
            <span>Firme aquí con el dedo, lápiz óptico (Stylus) o mouse</span>
            {signerName && (
              <span className="mt-0.5 font-medium text-slate-500">
                Firmante: {signerName}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        {hasStrokes ? (
          <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Firma electrónica capturada (Ley 527/1999)
          </span>
        ) : (
          <span className="text-slate-500">Pendiente de captura de firma</span>
        )}
        {signerName && (
          <span className="truncate font-medium text-slate-600">{signerName}</span>
        )}
      </div>

      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
