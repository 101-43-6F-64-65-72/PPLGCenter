"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";

/**
 * ImageCropUploader - Standalone image picker & cropper using HTML5 Canvas.
 * Aspect ratio is 16:9 to match mading card cover image.
 * No external library needed.
 */
export default function ImageCropUploader({ onCropped, label = "Gambar Sampul Mading" }) {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const [rawSrc, setRawSrc] = useState(null);         // raw loaded image src
  const [preview, setPreview] = useState(null);        // final cropped Data URL
  const [showCropper, setShowCropper] = useState(false);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, w: 300, h: 169 }); // 16:9 box
  const dragStart = useRef(null);
  const resizeHandle = useRef(null);

  const IMG_W = 560;  // canvas display width
  const IMG_H = 315;  // canvas display height (16:9)
  const ASPECT = 16 / 9;

  const loadImageFromFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setRawSrc(e.target.result);
      setShowCropper(true);
      // Reset crop box
      setCropBox({ x: 0, y: 0, w: IMG_W, h: Math.round(IMG_W / ASPECT) });
    };
    reader.readAsDataURL(file);
  };

  // Draw canvas whenever cropBox changes
  useEffect(() => {
    if (!showCropper || !rawSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new window.Image();
    img.onload = () => {
      canvas.width = IMG_W;
      canvas.height = IMG_H;
      ctx.clearRect(0, 0, IMG_W, IMG_H);
      ctx.drawImage(img, 0, 0, IMG_W, IMG_H);

      // Overlay dimmer
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, IMG_W, IMG_H);

      // Clear crop box
      ctx.clearRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);
      ctx.drawImage(img, cropBox.x, cropBox.y, cropBox.w, cropBox.h, cropBox.x, cropBox.y, cropBox.w, cropBox.h);

      // Crop box border
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);

      // Corner handles
      const hs = 8;
      ctx.fillStyle = "#6366f1";
      ctx.setLineDash([]);
      const corners = [
        [cropBox.x, cropBox.y],
        [cropBox.x + cropBox.w - hs, cropBox.y],
        [cropBox.x, cropBox.y + cropBox.h - hs],
        [cropBox.x + cropBox.w - hs, cropBox.y + cropBox.h - hs],
      ];
      corners.forEach(([cx, cy]) => ctx.fillRect(cx, cy, hs, hs));
    };
    img.src = rawSrc;
  }, [rawSrc, showCropper, cropBox]);

  // Mouse pointer management
  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (IMG_W / rect.width),
      y: (e.clientY - rect.top) * (IMG_H / rect.height),
    };
  };

  const getResizeHandle = (pos) => {
    const hs = 12;
    const { x: bx, y: by, w: bw, h: bh } = cropBox;
    if (pos.x >= bx + bw - hs && pos.y >= by + bh - hs) return "se";
    if (pos.x <= bx + hs && pos.y >= by + bh - hs) return "sw";
    if (pos.x >= bx + bw - hs && pos.y <= by + hs) return "ne";
    if (pos.x <= bx + hs && pos.y <= by + hs) return "nw";
    return null;
  };

  const onMouseDown = (e) => {
    const pos = getMousePos(e);
    const handle = getResizeHandle(pos);
    if (handle) {
      resizeHandle.current = handle;
    } else if (
      pos.x >= cropBox.x && pos.x <= cropBox.x + cropBox.w &&
      pos.y >= cropBox.y && pos.y <= cropBox.y + cropBox.h
    ) {
      resizeHandle.current = "move";
    } else {
      return;
    }
    dragStart.current = { pos, box: { ...cropBox } };
    setIsDragging(true);
  };

  const onMouseMove = (e) => {
    if (!isDragging || !dragStart.current) return;
    const pos = getMousePos(e);
    const dx = pos.x - dragStart.current.pos.x;
    const dy = pos.y - dragStart.current.pos.y;
    const orig = dragStart.current.box;

    let { x, y, w, h } = orig;

    if (resizeHandle.current === "move") {
      x = Math.max(0, Math.min(IMG_W - w, orig.x + dx));
      y = Math.max(0, Math.min(IMG_H - h, orig.y + dy));
    } else if (resizeHandle.current === "se") {
      w = Math.max(80, Math.min(IMG_W - orig.x, orig.w + dx));
      h = Math.round(w / ASPECT);
      if (orig.y + h > IMG_H) { h = IMG_H - orig.y; w = Math.round(h * ASPECT); }
    } else if (resizeHandle.current === "sw") {
      w = Math.max(80, orig.w - dx);
      h = Math.round(w / ASPECT);
      x = orig.x + orig.w - w;
      if (x < 0) { x = 0; w = orig.x + orig.w; h = Math.round(w / ASPECT); }
    } else if (resizeHandle.current === "ne") {
      w = Math.max(80, orig.w + dx);
      h = Math.round(w / ASPECT);
      y = orig.y + orig.h - h;
      if (y < 0) { y = 0; h = orig.y + orig.h; w = Math.round(h * ASPECT); }
    } else if (resizeHandle.current === "nw") {
      w = Math.max(80, orig.w - dx);
      h = Math.round(w / ASPECT);
      x = orig.x + orig.w - w;
      y = orig.y + orig.h - h;
      if (x < 0) { x = 0; w = orig.x + orig.w; h = Math.round(w / ASPECT); y = orig.y + orig.h - h; }
      if (y < 0) { y = 0; h = orig.y + orig.h; w = Math.round(h * ASPECT); }
    }

    setCropBox({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
  };

  const onMouseUp = () => {
    setIsDragging(false);
    dragStart.current = null;
    resizeHandle.current = null;
  };

  const applyCrop = () => {
    if (!rawSrc) return;
    const img = new window.Image();
    img.onload = () => {
      // Map canvas coords back to actual image dimensions
      const scaleX = img.naturalWidth / IMG_W;
      const scaleY = img.naturalHeight / IMG_H;
      const sx = Math.round(cropBox.x * scaleX);
      const sy = Math.round(cropBox.y * scaleY);
      const sw = Math.round(cropBox.w * scaleX);
      const sh = Math.round(cropBox.h * scaleY);

      const out = document.createElement("canvas");
      out.width = sw;
      out.height = sh;
      out.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      const croppedDataUrl = out.toDataURL("image/jpeg", 0.9);
      setPreview(croppedDataUrl);
      setShowCropper(false);
      onCropped && onCropped(croppedDataUrl);
    };
    img.src = rawSrc;
  };

  const resetCrop = () => {
    setRawSrc(null);
    setPreview(null);
    setShowCropper(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
        {label}
      </label>

      {/* Preview */}
      {preview && !showCropper && (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-gray-200 mb-2 bg-gray-100 group">
          <img src={preview} alt="Sampul" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setShowCropper(true)}
              className="px-3 py-1.5 bg-white text-gray-900 text-xs font-bold rounded-xl shadow cursor-pointer"
            >
              ✂ Crop Ulang
            </button>
            <button
              type="button"
              onClick={resetCrop}
              className="px-3 py-1.5 bg-rose-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
            >
              🗑 Hapus
            </button>
          </div>
        </div>
      )}

      {/* Crop UI */}
      {showCropper && rawSrc && (
        <div className="rounded-2xl overflow-hidden border border-indigo-200 bg-gray-900 mb-2 shadow-lg">
          <div className="px-4 py-2.5 bg-indigo-600 text-white text-xs font-bold flex items-center justify-between">
            <span>✂ Sesuaikan Area Gambar (Seret/Resize Kotak Crop)</span>
            <span className="text-indigo-200 font-normal">Rasio 16:9</span>
          </div>
          <canvas
            ref={canvasRef}
            width={IMG_W}
            height={IMG_H}
            className="w-full cursor-crosshair block"
            style={{ maxHeight: "260px", objectFit: "contain" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />
          <div className="flex items-center justify-end gap-2 px-4 py-3 bg-gray-800">
            <button
              type="button"
              onClick={resetCrop}
              className="px-4 py-1.5 rounded-xl bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={applyCrop}
              className="px-5 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
            >
              ✓ Terapkan Crop
            </button>
          </div>
        </div>
      )}

      {/* File picker button */}
      {!showCropper && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-gray-400 hover:text-indigo-600 transition-all cursor-pointer"
        >
          <svg className="w-8 h-8 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div className="text-center">
            <p className="text-xs font-semibold">{preview ? "Ganti Gambar Sampul" : "Pilih Gambar dari Perangkat"}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WEBP — Max 5MB</p>
          </div>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => loadImageFromFile(e.target.files?.[0])}
      />
    </div>
  );
}
