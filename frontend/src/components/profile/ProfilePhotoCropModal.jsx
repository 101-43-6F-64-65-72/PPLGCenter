"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  ZoomIn,
  RotateCw,
  RotateCcw,
  RefreshCw,
  Check,
  Crop as CropIcon,
} from "lucide-react";

/**
 * 1:1 Profile Photo Interactive Crop Modal
 * Conforms strictly to PPLG Center Design System (rounded-none, 1px crisp borders, #2C1EE8)
 */
export default function ProfilePhotoCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}) {
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset state when a new image is loaded
  useEffect(() => {
    if (isOpen && imageSrc) {
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isOpen, imageSrc]);

  // Handle Mouse Drag for Panning
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle Touch Drag for Mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle Mouse Wheel for Zooming
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(Math.max(0.5, prev + zoomFactor), 4));
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleTouchEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Execute 1:1 Canvas High Resolution Export
  const handleConfirmCrop = async () => {
    if (!imageRef.current || !containerRef.current) return;
    setIsProcessing(true);

    try {
      const img = imageRef.current;
      const cropSize = 512; // Standard crisp square avatar resolution
      const canvas = document.createElement("canvas");
      canvas.width = cropSize;
      canvas.height = cropSize;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Gagal menginisialisasi canvas.");

      // Calculate viewport vs natural image dimensions
      const viewportBox = containerRef.current.getBoundingClientRect();

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Translate context to center of canvas
      ctx.translate(cropSize / 2, cropSize / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      // Translate context by pan offset normalized to canvas size
      const panFactor = cropSize / viewportBox.width;
      ctx.translate((pan.x * panFactor) / zoom, (pan.y * panFactor) / zoom);

      // Draw the image centered
      const drawW = img.width * panFactor;
      const drawH = img.height * panFactor;
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

      // Convert Canvas to Blob & File
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsProcessing(false);
            return;
          }
          const croppedFile = new File([blob], `avatar_1x1_${Date.now()}.webp`, {
            type: "image/webp",
          });
          onCropComplete(blob, croppedFile);
          setIsProcessing(false);
        },
        "image/webp",
        0.92
      );
    } catch (err) {
      console.error("Failed to crop image:", err);
      setIsProcessing(false);
    }
  };

  const handleRotateLeft = () => setRotation((prev) => (prev - 90) % 360);
  const handleRotateRight = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div className="relative w-full max-w-lg bg-white rounded-none border border-slate-200 shadow-2xl overflow-hidden my-6 text-left flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <CropIcon className="w-4 h-4 text-[#2C1EE8]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Sesuaikan Foto Profil (1:1)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-none text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop Viewport */}
        <div className="p-5 space-y-4 bg-slate-50">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onWheel={handleWheel}
            className="relative w-full aspect-square max-w-[340px] mx-auto bg-slate-900 border border-slate-300 overflow-hidden select-none cursor-move flex items-center justify-center shadow-inner"
          >
            {/* Movable Image */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop target"
              draggable={false}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.05s ease-out",
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
              className="pointer-events-none"
            />

            {/* 1:1 Grid Overlay (Rule of thirds guide) */}
            <div className="absolute inset-0 pointer-events-none border-2 border-white/80 grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-b border-white/25" />
              <div className="border-r border-white/25" />
              <div className="border-r border-white/25" />
              <div />
            </div>

            {/* Center Focus Badge */}
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white font-mono text-[9.5px] font-bold uppercase tracking-wider rounded-none pointer-events-none">
              Rasio 1:1 Persegi
            </div>
          </div>

          {/* Interactive Controls Bar */}
          <div className="bg-white p-3.5 border border-slate-200 rounded-none space-y-3">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1 shrink-0">
                <ZoomIn className="w-3.5 h-3.5 text-[#2C1EE8]" />
                <span>Zoom</span>
              </span>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-[#2C1EE8] cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-slate-700 w-10 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Action Buttons: Rotate & Reset */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRotateLeft}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-none transition cursor-pointer"
                  title="Putar 90° ke kiri"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>-90°</span>
                </button>
                <button
                  type="button"
                  onClick={handleRotateRight}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-none transition cursor-pointer"
                  title="Putar 90° ke kanan"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>+90°</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-none transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirmCrop}
            disabled={isProcessing}
            className="px-4 py-2 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white text-xs font-bold uppercase tracking-wider rounded-none transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Terapkan & Simpan Foto</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
