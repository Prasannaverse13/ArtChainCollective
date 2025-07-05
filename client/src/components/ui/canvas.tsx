import React from 'react';
import { useCanvas } from '@/hooks/use-canvas';

interface CanvasProps {
  artworkId?: number;
  initialData?: string;
  readOnly?: boolean;
  collaborative?: boolean;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Canvas({
  artworkId,
  initialData,
  readOnly = false,
  collaborative = false,
  width = "100%",
  height = "100%",
  className = ""
}: CanvasProps) {
  const {
    canvasRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  } = useCanvas({
    artworkId,
    initialData,
    readOnly,
    collaborative
  });

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {/* Grid background for canvas */}
      <div className="absolute inset-0 canvas-grid z-0"></div>
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 touch-none"
        style={{ width: '100%', height: '100%' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
}

export default Canvas;
