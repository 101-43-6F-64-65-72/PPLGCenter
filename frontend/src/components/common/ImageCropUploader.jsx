"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Check,
  X,
  Move,
  Crop as CropIcon,
  Upload,
  Trash2,
  Sparkles,
} from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";
import TwinOrbitSpinner from "@/components/ui/TwinOrbitSpinner";

/**
 * Aspect ratio definitions supported by the interactive cropper
 */
const ASPECT_RATIOS = [
  { id: "16:9", label: "16:9", ratio: 16 / 9 },
  { id: "4:3", label: "4:3", ratio: 4 / 3 },
  { id: "1:1", label: "1:1", ratio: 1 },
  { id: "3:4", label: "3:4", ratio: 3 / 4 },
  { id: "free", label: "Free", ratio: null },
];

/**
 * Interactive ImageCropUploader Component for Student Center
 *
 * Styled to perfectly match Student Center UI design system:
 * - Brand Color `#2c1ee8` & blue gradients
 * - Smooth interactive crop area (drag & resize with 8 handles)
 * - Zoom (100%-300%), Pan, Rotations (0°, 90°, 180°, 270°)
 * - Real-time instant live preview & metadata
 * - High-precision canvas crop output (Blob, File, DataURL)
 */
export default function ImageCropUploader({
  onCropped,
  onRemove,
  label = "Cover Ekstrakurikuler",
  defaultAspectRatio = "16:9",
  initialImageUrl = null,
  isUploading = false,
  uploadError = "",
}) {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  // Loaded raw image state
  const [rawFile, setRawFile] = useState(null);
  const [rawSrc, setRawSrc] = useState(null);
  const [rawImageObj, setRawImageObj] = useState(null);

  // Final cropped output preview DataURL & file info
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const [croppedMetadata, setCroppedMetadata] = useState(null);
  const [validationError, setValidationError] = useState("");

  // Sync initialImageUrl if provided
  const [currentCoverUrl, setCurrentCoverUrl] = useState(initialImageUrl);

  useEffect(() => {
    setCurrentCoverUrl(initialImageUrl);
  }, [initialImageUrl]);

  // Cropper Modal UI state
  const [showModal, setShowModal] = useState(false);

  // Transformation states
  const [aspectRatioId, setAspectRatioId] = useState(defaultAspectRatio);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [zoom, setZoom] = useState(1.0); // 1.0 to 3.0
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Crop box rectangle (in canvas viewport coordinates)
  const [cropBox, setCropBox] = useState({ x: 40, y: 30, w: 480, h: 270 });

  // Real-time live preview state
  const [livePreviewUrl, setLivePreviewUrl] = useState(null);

  // Interaction dragging states
  const [isInteracting, setIsInteracting] = useState(false);
  const activeModeRef = useRef(null); // 'move-crop' | 'pan-image' | handle ('nw', 'se', etc.)
  const dragStartRef = useRef(null);

  // Viewport dimensions for display canvas
  const VIEWPORT_W = 580;
  const VIEWPORT_H = 360;

  // 1. Load image file with validation
  const handleFileSelect = (file) => {
    setValidationError("");
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setValidationError("Format gambar tidak didukung.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE_BYTES) {
      setValidationError("Ukuran gambar maksimal 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setRawFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target.result;
      setRawSrc(src);

      const img = new window.Image();
      img.onload = () => {
        setRawImageObj(img);
        resetTransformationState(img, defaultAspectRatio);
        setShowModal(true);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Reset transformation & crop box to centered defaults
  const resetTransformationState = (
    img = rawImageObj,
    ratioId = aspectRatioId,
  ) => {
    setRotation(0);
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setAspectRatioId(ratioId);

    if (!img) return;

    const selected =
      ASPECT_RATIOS.find((r) => r.id === ratioId) || ASPECT_RATIOS[0];
    const targetRatio = selected.ratio || 16 / 9;

    let w = Math.min(VIEWPORT_W - 60, 460);
    let h = Math.round(w / targetRatio);

    if (h > VIEWPORT_H - 50) {
      h = VIEWPORT_H - 50;
      w = Math.round(h * targetRatio);
    }

    const x = Math.round((VIEWPORT_W - w) / 2);
    const y = Math.round((VIEWPORT_H - h) / 2);

    setCropBox({ x, y, w, h });
  };

  // Handle Aspect Ratio Change
  const handleAspectRatioChange = (newRatioId) => {
    setAspectRatioId(newRatioId);
    const selected = ASPECT_RATIOS.find((r) => r.id === newRatioId);
    if (!selected || !selected.ratio) return;

    const targetRatio = selected.ratio;
    let newW = cropBox.w;
    let newH = Math.round(newW / targetRatio);

    if (newH > VIEWPORT_H - 20) {
      newH = VIEWPORT_H - 20;
      newW = Math.round(newH * targetRatio);
    }

    let newX = cropBox.x;
    let newY = cropBox.y;

    if (newX + newW > VIEWPORT_W) newX = Math.max(0, VIEWPORT_W - newW);
    if (newY + newH > VIEWPORT_H) newY = Math.max(0, VIEWPORT_H - newH);

    setCropBox({ x: newX, y: newY, w: newW, h: newH });
  };

  // Rotate handler
  const handleRotate = (dir) => {
    setRotation((prev) => {
      let next = dir === "cw" ? prev + 90 : prev - 90;
      if (next >= 360) next = 0;
      if (next < 0) next = 270;
      return next;
    });
  };

  // 2. Draw canvas function (Image + Transform + Dark Mask + Crop Box + Grid + Handles)
  const drawMainCanvas = useCallback(() => {
    if (!canvasRef.current || !rawImageObj) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = VIEWPORT_W;
    canvas.height = VIEWPORT_H;

    // Dark canvas background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);

    // Calculate base scale for image inside viewport
    const isSwapped = rotation === 90 || rotation === 270;
    const imgW = isSwapped
      ? rawImageObj.naturalHeight
      : rawImageObj.naturalWidth;
    const imgH = isSwapped
      ? rawImageObj.naturalWidth
      : rawImageObj.naturalHeight;

    const baseScale = Math.min(
      (VIEWPORT_W - 30) / imgW,
      (VIEWPORT_H - 30) / imgH,
    );

    const drawW = rawImageObj.naturalWidth * baseScale;
    const drawH = rawImageObj.naturalHeight * baseScale;

    // Render transformed background image
    ctx.save();
    ctx.translate(VIEWPORT_W / 2 + pan.x, VIEWPORT_H / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.drawImage(rawImageObj, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Dark mask outside crop box
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);

    // Clear crop area to reveal clear image
    ctx.save();
    ctx.beginPath();
    ctx.rect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);
    ctx.clip();

    // Redraw image inside clip
    ctx.translate(VIEWPORT_W / 2 + pan.x, VIEWPORT_H / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.drawImage(rawImageObj, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Draw Crop Box Border (Brand #2c1ee8 border)
    ctx.save();
    ctx.strokeStyle = "#2c1ee8";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);

    // Inner subtle border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 1;
    ctx.strokeRect(cropBox.x + 1, cropBox.y + 1, cropBox.w - 2, cropBox.h - 2);

    // Rule of thirds grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const thirdW = cropBox.w / 3;
    const thirdH = cropBox.h / 3;

    // Vertical & Horizontal grid lines
    ctx.beginPath();
    ctx.moveTo(cropBox.x + thirdW, cropBox.y);
    ctx.lineTo(cropBox.x + thirdW, cropBox.y + cropBox.h);
    ctx.moveTo(cropBox.x + thirdW * 2, cropBox.y);
    ctx.lineTo(cropBox.x + thirdW * 2, cropBox.y + cropBox.h);

    ctx.moveTo(cropBox.x, cropBox.y + thirdH);
    ctx.lineTo(cropBox.x + cropBox.w, cropBox.y + thirdH);
    ctx.moveTo(cropBox.x, cropBox.y + thirdH * 2);
    ctx.lineTo(cropBox.x + cropBox.w, cropBox.y + thirdH * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw 8 Handles (Corners & Edges)
    const handleSize = 10;
    const halfH = handleSize / 2;

    const handles = [
      { id: "nw", x: cropBox.x - halfH, y: cropBox.y - halfH },
      { id: "ne", x: cropBox.x + cropBox.w - halfH, y: cropBox.y - halfH },
      { id: "sw", x: cropBox.x - halfH, y: cropBox.y + cropBox.h - halfH },
      {
        id: "se",
        x: cropBox.x + cropBox.w - halfH,
        y: cropBox.y + cropBox.h - halfH,
      },
      { id: "n", x: cropBox.x + cropBox.w / 2 - halfH, y: cropBox.y - halfH },
      {
        id: "s",
        x: cropBox.x + cropBox.w / 2 - halfH,
        y: cropBox.y + cropBox.h - halfH,
      },
      { id: "w", x: cropBox.x - halfH, y: cropBox.y + cropBox.h / 2 - halfH },
      {
        id: "e",
        x: cropBox.x + cropBox.w - halfH,
        y: cropBox.y + cropBox.h / 2 - halfH,
      },
    ];

    handles.forEach((h) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(h.x, h.y, handleSize, handleSize);
      ctx.strokeStyle = "#2c1ee8";
      ctx.lineWidth = 2;
      ctx.strokeRect(h.x, h.y, handleSize, handleSize);
    });

    ctx.restore();
  }, [rawImageObj, rotation, zoom, pan, cropBox]);

  // 3. Render Real-Time Live Preview Thumbnail
  const updateLivePreview = useCallback(() => {
    if (!rawImageObj) return;

    try {
      const isSwapped = rotation === 90 || rotation === 270;
      const imgW = isSwapped
        ? rawImageObj.naturalHeight
        : rawImageObj.naturalWidth;
      const imgH = isSwapped
        ? rawImageObj.naturalWidth
        : rawImageObj.naturalHeight;

      const baseScale = Math.min(
        (VIEWPORT_W - 30) / imgW,
        (VIEWPORT_H - 30) / imgH,
      );

      const drawW = rawImageObj.naturalWidth * baseScale;
      const drawH = rawImageObj.naturalHeight * baseScale;

      const previewCanvas = document.createElement("canvas");
      const previewW = Math.max(160, Math.round(cropBox.w));
      const previewH = Math.max(90, Math.round(cropBox.h));
      previewCanvas.width = previewW;
      previewCanvas.height = previewH;

      const pCtx = previewCanvas.getContext("2d");
      if (!pCtx) return;

      pCtx.fillStyle = "#000000";
      pCtx.fillRect(0, 0, previewW, previewH);

      const scaleX = previewW / cropBox.w;
      const scaleY = previewH / cropBox.h;

      pCtx.save();
      pCtx.scale(scaleX, scaleY);
      pCtx.translate(-cropBox.x, -cropBox.y);
      pCtx.translate(VIEWPORT_W / 2 + pan.x, VIEWPORT_H / 2 + pan.y);
      pCtx.rotate((rotation * Math.PI) / 180);
      pCtx.scale(zoom, zoom);
      pCtx.drawImage(rawImageObj, -drawW / 2, -drawH / 2, drawW, drawH);
      pCtx.restore();

      const url = previewCanvas.toDataURL("image/jpeg", 0.85);
      setLivePreviewUrl(url);
    } catch {
      // Ignore preview errors
    }
  }, [rawImageObj, rotation, zoom, pan, cropBox]);

  useEffect(() => {
    let isMounted = true;
    if (showModal) {
      drawMainCanvas();
      queueMicrotask(() => {
        if (isMounted) updateLivePreview();
      });
    }
    return () => {
      isMounted = false;
    };
  }, [showModal, drawMainCanvas, updateLivePreview]);

  // Pointer position helper
  const getMousePos = (e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (VIEWPORT_W / rect.width),
      y: (clientY - rect.top) * (VIEWPORT_H / rect.height),
    };
  };

  const getHandleAtPos = (pos) => {
    const handleSize = 16;
    const halfH = handleSize / 2;
    const { x: bx, y: by, w: bw, h: bh } = cropBox;

    if (Math.abs(pos.x - bx) <= halfH && Math.abs(pos.y - by) <= halfH)
      return "nw";
    if (Math.abs(pos.x - (bx + bw)) <= halfH && Math.abs(pos.y - by) <= halfH)
      return "ne";
    if (Math.abs(pos.x - bx) <= halfH && Math.abs(pos.y - (by + bh)) <= halfH)
      return "sw";
    if (
      Math.abs(pos.x - (bx + bw)) <= halfH &&
      Math.abs(pos.y - (by + bh)) <= halfH
    )
      return "se";

    if (
      Math.abs(pos.x - (bx + bw / 2)) <= halfH &&
      Math.abs(pos.y - by) <= halfH
    )
      return "n";
    if (
      Math.abs(pos.x - (bx + bw / 2)) <= halfH &&
      Math.abs(pos.y - (by + bh)) <= halfH
    )
      return "s";
    if (
      Math.abs(pos.x - bx) <= halfH &&
      Math.abs(pos.y - (by + bh / 2)) <= halfH
    )
      return "w";
    if (
      Math.abs(pos.x - (bx + bw)) <= halfH &&
      Math.abs(pos.y - (by + bh / 2)) <= halfH
    )
      return "e";

    if (pos.x >= bx && pos.x <= bx + bw && pos.y >= by && pos.y <= by + bh) {
      return "move-crop";
    }

    return "pan-image";
  };

  const onPointerDown = (e) => {
    if (!showModal) return;
    const pos = getMousePos(e);
    const mode = getHandleAtPos(pos);
    activeModeRef.current = mode;
    dragStartRef.current = {
      pos,
      cropBox: { ...cropBox },
      pan: { ...pan },
    };
    setIsInteracting(true);
  };

  const onPointerMove = (e) => {
    if (!isInteracting || !dragStartRef.current || !activeModeRef.current)
      return;
    const pos = getMousePos(e);
    const dx = pos.x - dragStartRef.current.pos.x;
    const dy = pos.y - dragStartRef.current.pos.y;
    const origBox = dragStartRef.current.cropBox;
    const origPan = dragStartRef.current.pan;
    const mode = activeModeRef.current;

    const currentRatioObj = ASPECT_RATIOS.find((r) => r.id === aspectRatioId);
    const targetRatio = currentRatioObj ? currentRatioObj.ratio : null;

    if (mode === "move-crop") {
      let newX = Math.max(0, Math.min(VIEWPORT_W - origBox.w, origBox.x + dx));
      let newY = Math.max(0, Math.min(VIEWPORT_H - origBox.h, origBox.y + dy));
      setCropBox((prev) => ({
        ...prev,
        x: Math.round(newX),
        y: Math.round(newY),
      }));
    } else if (mode === "pan-image") {
      setPan({ x: Math.round(origPan.x + dx), y: Math.round(origPan.y + dy) });
    } else {
      let { x, y, w, h } = origBox;

      if (mode.includes("e")) w = Math.max(60, origBox.w + dx);
      if (mode.includes("s")) h = Math.max(60, origBox.h + dy);
      if (mode.includes("w")) {
        const potentialW = Math.max(60, origBox.w - dx);
        x = origBox.x + (origBox.w - potentialW);
        w = potentialW;
      }
      if (mode.includes("n")) {
        const potentialH = Math.max(60, origBox.h - dy);
        y = origBox.y + (origBox.h - potentialH);
        h = potentialH;
      }

      if (targetRatio) {
        if (mode === "e" || mode === "w" || mode === "se" || mode === "sw") {
          h = Math.round(w / targetRatio);
        } else {
          w = Math.round(h * targetRatio);
        }
      }

      if (x < 0) x = 0;
      if (y < 0) y = 0;
      if (x + w > VIEWPORT_W) w = VIEWPORT_W - x;
      if (y + h > VIEWPORT_H) h = VIEWPORT_H - y;

      setCropBox({
        x: Math.round(x),
        y: Math.round(y),
        w: Math.round(w),
        h: Math.round(h),
      });
    }
  };

  const onPointerUp = () => {
    setIsInteracting(false);
    activeModeRef.current = null;
    dragStartRef.current = null;
  };

  const onWheel = (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom((prev) =>
      Math.min(3.0, Math.max(1.0, parseFloat((prev + zoomDelta).toFixed(2)))),
    );
  };

  // High-Precision Crop Export
  const applyCrop = () => {
    if (!rawImageObj) return;

    const isSwapped = rotation === 90 || rotation === 270;
    const imgW = isSwapped
      ? rawImageObj.naturalHeight
      : rawImageObj.naturalWidth;
    const imgH = isSwapped
      ? rawImageObj.naturalWidth
      : rawImageObj.naturalHeight;

    const baseScale = Math.min(
      (VIEWPORT_W - 30) / imgW,
      (VIEWPORT_H - 30) / imgH,
    );

    const drawW = rawImageObj.naturalWidth * baseScale;
    const drawH = rawImageObj.naturalHeight * baseScale;

    const scaleToNatural = rawImageObj.naturalWidth / drawW;
    const outW = Math.max(100, Math.round(cropBox.w * scaleToNatural));
    const outH = Math.max(100, Math.round(cropBox.h * scaleToNatural));

    const outCanvas = document.createElement("canvas");
    outCanvas.width = outW;
    outCanvas.height = outH;

    const ctx = outCanvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const scaleX = outW / cropBox.w;
    const scaleY = outH / cropBox.h;

    ctx.save();
    ctx.scale(scaleX, scaleY);
    ctx.translate(-cropBox.x, -cropBox.y);
    ctx.translate(VIEWPORT_W / 2 + pan.x, VIEWPORT_H / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.drawImage(rawImageObj, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    const croppedDataUrl = outCanvas.toDataURL("image/jpeg", 0.92);

    outCanvas.toBlob(
      (blob) => {
        const file = new File([blob], `mading-crop-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        const currentRatioObj = ASPECT_RATIOS.find(
          (r) => r.id === aspectRatioId,
        );
        const metadata = {
          croppedDataUrl,
          croppedBlob: blob,
          croppedFile: file,
          width: outW,
          height: outH,
          aspectRatio: currentRatioObj?.label || aspectRatioId,
          cropBox: { ...cropBox },
          zoom,
          rotation,
        };

        setPreviewDataUrl(croppedDataUrl);
        setCroppedMetadata(metadata);
        setShowModal(false);

        if (onCropped) {
          onCropped(croppedDataUrl, metadata);
        }
      },
      "image/jpeg",
      0.92,
    );
  };

  const handleFullReset = () => {
    setRawFile(null);
    setRawSrc(null);
    setRawImageObj(null);
    setPreviewDataUrl(null);
    setCroppedMetadata(null);
    setCurrentCoverUrl(null);
    setValidationError("");
    setShowModal(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onRemove) onRemove();
  };

  const activeDisplayUrl = previewDataUrl || currentCoverUrl;

  const fileSizeFormatted = croppedMetadata?.croppedFile?.size
    ? `${(croppedMetadata.croppedFile.size / (1024 * 1024)).toFixed(2)} MB`
    : rawFile?.size
    ? `${(rawFile.size / (1024 * 1024)).toFixed(2)} MB`
    : null;

  const fileNameDisplay = croppedMetadata?.croppedFile?.name || rawFile?.name || null;

  return (
    <div className="w-full space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
        {label}
      </label>

      {(validationError || uploadError) && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center justify-between">
          <span>{validationError || uploadError}</span>
          <button
            type="button"
            onClick={() => setValidationError("")}
            className="text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Final Cropped Result or Initial Cover Preview Card */}
      {activeDisplayUrl && !showModal && (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-slate-900 group transition-all">
          <img
            src={resolveImageUrl(activeDisplayUrl)}
            alt="Preview Cover"
            className="w-full h-full object-cover"
          />

          {/* Metadata & File Info Badge */}
          <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-2 border border-white/10 shadow-md max-w-[85%] truncate">
            <span className="text-blue-400 font-bold shrink-0">16:9</span>
            {fileNameDisplay && (
              <>
                <span>•</span>
                <span className="truncate">{fileNameDisplay}</span>
              </>
            )}
            {fileSizeFormatted && (
              <>
                <span>•</span>
                <span className="shrink-0">{fileSizeFormatted}</span>
              </>
            )}
          </div>

          {/* Action Overlay */}
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-[#2c1ee8] hover:bg-[#2218a3] text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Ganti Cover</span>
            </button>
            {rawImageObj && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
              >
                <CropIcon className="w-4 h-4" />
                <span>Crop Ulang</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleFullReset}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading Indicator during Upload */}
      {isUploading && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-extrabold text-[#2c1ee8] flex items-center gap-3">
          <TwinOrbitSpinner size="xs" color="primary" />
          <span>Mengunggah & Memproses Gambar...</span>
        </div>
      )}

      {/* 2. File Picker Input Button (Empty State) */}
      {!activeDisplayUrl && !showModal && !isUploading && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 py-7 px-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#2c1ee8] hover:bg-blue-50/40 text-gray-400 hover:text-[#2c1ee8] transition-all cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#2c1ee8] group-hover:scale-110 transition-transform flex items-center justify-center shadow-xs">
            <Upload className="w-5 h-5" />
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-gray-800 group-hover:text-[#2c1ee8]">
              Tambah Cover
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              JPG, PNG, atau WEBP • Maks. 5 MB (Rasio 16:9)
            </p>
          </div>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files?.[0])}
      />

      {/* 3. Interactive Crop Workspace Modal (Matching Student Center UI System) */}
      {showModal && rawImageObj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
            {/* Student Center Blue Gradient Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#2c1ee8] to-blue-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                  <CropIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold">
                    Editor Crop & Framing Gambar
                  </h2>
                  <p className="text-xs text-blue-100">
                    Atur area potong, rasio aspek, zoom, dan rotasi gambar
                    secara interaktif
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1 p-6 gap-6 bg-slate-50">
              {/* Left Column: Interactive Canvas Viewport */}
              <div className="lg:col-span-8 flex flex-col items-center justify-center space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-xl bg-slate-950 select-none">
                  <canvas
                    ref={canvasRef}
                    width={VIEWPORT_W}
                    height={VIEWPORT_H}
                    onMouseDown={onPointerDown}
                    onMouseMove={onPointerMove}
                    onMouseUp={onPointerUp}
                    onMouseLeave={onPointerUp}
                    onTouchStart={onPointerDown}
                    onTouchMove={onPointerMove}
                    onTouchEnd={onPointerUp}
                    onWheel={onWheel}
                    className="cursor-crosshair block touch-none"
                    style={{
                      width: `${VIEWPORT_W}px`,
                      height: `${VIEWPORT_H}px`,
                    }}
                  />

                  {/* Top-right Canvas Hint Badge */}
                  <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium text-slate-300 border border-slate-700 flex items-center gap-1.5 pointer-events-none">
                    <Move className="w-3.5 h-3.5 text-blue-400" />
                    <span>Scroll: Zoom | Drag: Geser/Resize</span>
                  </div>
                </div>

                {/* Quick Transformation Toolbar */}
                <div className="flex flex-wrap items-center justify-between w-full max-w-[580px] px-4 py-3 rounded-2xl bg-white border border-gray-200 shadow-sm gap-3 text-xs">
                  {/* Zoom Slider */}
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <ZoomOut className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                      type="range"
                      min="1.0"
                      max="3.0"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#2c1ee8]"
                    />
                    <ZoomIn className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-gray-700 font-bold w-12 text-right">
                      {Math.round(zoom * 100)}%
                    </span>
                  </div>

                  {/* Rotation Controls */}
                  <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => handleRotate("ccw")}
                      title="Putar 90° Kiri"
                      className="p-1.5 rounded-lg text-gray-700 hover:text-[#2c1ee8] hover:bg-white cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-bold text-[#2c1ee8] px-1">
                      {rotation}°
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRotate("cw")}
                      title="Putar 90° Kanan"
                      className="p-1.5 rounded-lg text-gray-700 hover:text-[#2c1ee8] hover:bg-white cursor-pointer transition-colors"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Aspect Ratio & Live Preview Panel */}
              <div className="lg:col-span-4 flex flex-col justify-between space-y-6 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="space-y-5">
                  {/* Aspect Ratio Selector */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-2">
                      Rasio Aspek Gambar
                    </label>
                    <div className="grid grid-cols-5 gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                      {ASPECT_RATIOS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleAspectRatioChange(r.id)}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            aspectRatioId === r.id
                              ? "bg-[#2c1ee8] text-white shadow-xs"
                              : "text-gray-600 hover:text-gray-900 hover:bg-white"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Real-Time Live Preview Thumbnail */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-2 flex items-center justify-between">
                      <span>Preview Instan</span>
                      <span className="text-[11px] font-normal text-[#2c1ee8]">
                        {Math.round(cropBox.w)} × {Math.round(cropBox.h)} px
                      </span>
                    </label>

                    <div className="w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-slate-900 relative flex items-center justify-center shadow-inner">
                      {livePreviewUrl ? (
                        <img
                          src={livePreviewUrl}
                          alt="Live Preview"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">
                          Memuat preview...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer Action Buttons */}
                <div className="space-y-2.5 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    {/* Reset Button */}
                    <button
                      type="button"
                      onClick={() => resetTransformationState()}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>

                    {/* Cancel Button */}
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Batal</span>
                    </button>
                  </div>

                  {/* Crop / Apply Button */}
                  <button
                    type="button"
                    onClick={applyCrop}
                    className="w-full py-3 px-5 rounded-xl bg-[#2c1ee8] hover:bg-[#2218a3] text-white text-xs font-bold shadow-md shadow-[#2c1ee8]/20 cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Terapkan Crop Gambar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
