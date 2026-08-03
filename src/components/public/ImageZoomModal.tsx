import React, { useState, useEffect, useRef } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, ArrowDown } from "lucide-react";
import { getOptimizedImageUrl } from "@/lib/image-utils";

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt?: string;
  title?: string;
}

export function ImageZoomModal({ isOpen, onClose, src, alt, title }: ImageZoomModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [swipeY, setSwipeY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Touch tracking refs
  const touchStartRef = useRef<{
    dist: number;
    scale: number;
    x: number;
    y: number;
    posX: number;
    posY: number;
    time: number;
  } | null>(null);

  const lastTapRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const highResUrl = getOptimizedImageUrl(src, 1600);

  // Reset state when modal opens or image changes
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setSwipeY(0);
      setIsLoaded(false);
      setImgError(false);
    }
  }, [isOpen, src]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.75, 4.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.75, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setSwipeY(0);
  };

  // Helper for touch distance
  const getTouchDistance = (t1: React.Touch, t2: React.Touch) => {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  // Double tap handler
  const handleDoubleTap = (clientX: number, clientY: number) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected
      if (scale > 1) {
        handleReset();
      } else {
        setScale(2.5);
        // Center zoom near tap point
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const offsetX = (rect.width / 2 - (clientX - rect.left)) * 1.2;
          const offsetY = (rect.height / 2 - (clientY - rect.top)) * 1.2;
          setPosition({ x: offsetX, y: offsetY });
        }
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      touchStartRef.current = {
        dist,
        scale,
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        posX: position.x,
        posY: position.y,
        time: Date.now(),
      };
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = {
        dist: 0,
        scale,
        x: touch.clientX,
        y: touch.clientY,
        posX: position.x,
        posY: position.y,
        time: Date.now(),
      };
      handleDoubleTap(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    if (e.touches.length === 2) {
      // Pinch zooming
      const currentDist = getTouchDistance(e.touches[0], e.touches[1]);
      if (touchStartRef.current.dist > 0) {
        const ratio = currentDist / touchStartRef.current.dist;
        const newScale = Math.min(Math.max(touchStartRef.current.scale * ratio, 1), 5);
        setScale(newScale);
        if (newScale === 1) {
          setPosition({ x: 0, y: 0 });
        }
      }
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      if (scale > 1) {
        // Pan image when zoomed in
        setPosition({
          x: touchStartRef.current.posX + deltaX,
          y: touchStartRef.current.posY + deltaY,
        });
      } else {
        // Swipe down to close when scale is 1
        if (deltaY > 0) {
          setSwipeY(deltaY);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (scale === 1 && swipeY > 80) {
      // Trigger close on downward swipe threshold
      onClose();
    } else if (scale === 1) {
      setSwipeY(0);
    }
    touchStartRef.current = null;
  };

  // Mouse wheel zoom for desktop
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Mouse drag for desktop pan
  const isMouseDownRef = useRef(false);
  const mouseStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      isMouseDownRef.current = true;
      mouseStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      };
    } else {
      handleDoubleTap(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMouseDownRef.current && scale > 1) {
      const deltaX = e.clientX - mouseStartRef.current.x;
      const deltaY = e.clientY - mouseStartRef.current.y;
      setPosition({
        x: mouseStartRef.current.posX + deltaX,
        y: mouseStartRef.current.posY + deltaY,
      });
    }
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
  };

  if (!isOpen) return null;

  const backdropOpacity = scale === 1 ? Math.max(0.2, 1 - swipeY / 300) : 1;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-between select-none touch-none overflow-hidden transition-opacity duration-150"
      style={{
        backgroundColor: `rgba(0, 0, 0, ${0.95 * backdropOpacity})`,
        backdropFilter: "blur(12px)",
      }}
      onWheel={handleWheel}
    >
      {/* Top Bar Overlay */}
      <div className="w-full flex items-center justify-between px-4 py-3 z-50 bg-gradient-to-b from-black/80 via-black/40 to-transparent text-white">
        <div className="flex flex-col max-w-[70%]">
          <span className="text-sm font-semibold truncate text-white/90">
            {title || alt || "Vista ampliada de flyer"}
          </span>
          <span className="text-[11px] text-white/60 flex items-center gap-1">
            <ArrowDown className="h-3 w-3 animate-bounce" /> Desliza abajo o pellizca para zoom
          </span>
        </div>

        <button
          onClick={onClose}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 border border-white/20 shadow-lg"
          aria-label="Cerrar zoom"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Main Image Container */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Loading Spinner */}
        {!isLoaded && !imgError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 gap-2 z-10">
            <div className="h-10 w-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-xs font-medium bg-black/50 px-3 py-1 rounded-full border border-white/10">
              Cargando alta resolución...
            </span>
          </div>
        )}

        <img
          ref={imgRef}
          src={imgError ? src : highResUrl}
          alt={alt || "Imagen ampliada"}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setImgError(true);
            setIsLoaded(true);
          }}
          className="max-h-full max-w-full object-contain transition-transform duration-75 ease-out"
          style={{
            transform: `translate3d(${position.x}px, ${position.y + (scale === 1 ? swipeY : 0)}px, 0px) scale(${scale})`,
            transformOrigin: "center center",
            willChange: "transform",
          }}
          draggable={false}
        />
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="w-full flex items-center justify-center pb-6 pt-2 z-50 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-2xl text-white">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="p-2 rounded-full hover:bg-white/20 disabled:opacity-30 transition-all active:scale-95"
            title="Alejar (-)"
          >
            <ZoomOut className="h-5 w-5" />
          </button>

          <span className="text-xs font-mono font-bold w-12 text-center text-white/90">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={scale >= 4.5}
            className="p-2 rounded-full hover:bg-white/20 disabled:opacity-30 transition-all active:scale-95"
            title="Acercar (+)"
          >
            <ZoomIn className="h-5 w-5" />
          </button>

          {scale > 1 && (
            <>
              <div className="h-4 w-[1px] bg-white/20 mx-1" />
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 transition-all"
                title="Restablecer (100%)"
              >
                <RotateCcw className="h-3.5 w-3.5" /> 1:1
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
