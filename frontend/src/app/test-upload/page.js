"use client";

import React, { useState, useEffect } from "react";
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  Terminal, 
  Key, 
  ArrowLeft 
} from "lucide-react";
import Link from "next/link";
import { API_CONFIG } from "@/config/api";

export default function TestUploadPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [folder, setFolder] = useState("test-uploads");
  const [customToken, setCustomToken] = useState("");
  const [tokenSource, setTokenSource] = useState("None");
  
  const [loading, setLoading] = useState(false);
  const [uploadedResult, setUploadedResult] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [latency, setLatency] = useState(null);
  const [logs, setLogs] = useState([]);

  // Auto-detect JWT token from localStorage or cookie on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const lsToken = localStorage.getItem("token");
      const cookieMatch = document.cookie.match(/token=([^;]+)/);
      const cookieToken = cookieMatch ? cookieMatch[1] : null;

      if (lsToken) {
        setCustomToken(lsToken);
        setTokenSource("localStorage");
      } else if (cookieToken) {
        setCustomToken(cookieToken);
        setTokenSource("Cookie");
      } else {
        setTokenSource("Not Found");
      }
    }
  }, []);

  const addLog = (msg, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, msg, type }]);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setUploadedResult(null);
    setErrorDetails(null);
    setLogs([]);

    if (selected.type.startsWith("image/")) {
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setUploadedResult(null);
      setErrorDetails(null);
      setLogs([]);
      if (droppedFile.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(droppedFile));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Silakan pilih file terlebih dahulu.");
      return;
    }

    setLoading(true);
    setUploadedResult(null);
    setErrorDetails(null);
    setLogs([]);

    const startTime = performance.now();
    addLog(`Memulai upload file '${file.name}' (${(file.size / 1024).toFixed(1)} KB)...`, "info");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const backendUrl = API_CONFIG.BASE_URL.replace(/\/$/, "");
    const uploadEndpoint = `${backendUrl}/api/upload`;

    addLog(`Target Endpoint: POST ${uploadEndpoint}`, "info");

    const headers = {};
    if (customToken?.trim()) {
      headers["Authorization"] = `Bearer ${customToken.trim()}`;
      addLog(`Menggunakan Authorization Header (Bearer token)`, "info");
    } else {
      addLog(`PERINGATAN: Tanpa Authorization Header (Guest mode)`, "warning");
    }

    try {
      addLog(`Mengirim HTTP POST request ke server...`, "info");
      
      const res = await fetch(uploadEndpoint, {
        method: "POST",
        headers,
        body: formData,
      });

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      setLatency(duration);

      addLog(`Server merespons dengan HTTP Status Code: ${res.status} (${res.statusText}) dalam ${duration} ms`, res.ok ? "success" : "error");

      const responseText = await res.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { rawText: responseText };
      }

      if (res.ok) {
        addLog(`Upload Berhasil! Image/File disetujui server.`, "success");
        setUploadedResult(data);
      } else {
        const errorMsg = data?.message || data?.error?.message || data?.error || responseText || "Upload Gagal";
        addLog(`Upload Gagal: ${errorMsg}`, "error");
        setErrorDetails({
          status: res.status,
          statusText: res.statusText,
          data,
          message: errorMsg,
        });
      }
    } catch (err) {
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      addLog(`Network Error: ${err.message}`, "error");
      setErrorDetails({
        status: 0,
        statusText: "Network Failure / CORS",
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("URL berhasil disalin ke clipboard!");
  };

  const getResultUrl = () => {
    if (!uploadedResult) return null;
    return uploadedResult.data?.url || uploadedResult.url || uploadedResult.data?.path || uploadedResult.path;
  };

  const resultUrl = getResultUrl();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <Link 
              href="/admin" 
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <UploadCloud className="w-7 h-7 text-indigo-400" />
                Cloudinary & Upload Diagnostics Tester
              </h1>
              <p className="text-slate-400 text-sm">
                Pengujian langsung API Upload (`/api/upload`) dan Cloudinary CDN Integration
              </p>
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="text-slate-400">Backend API URL:</div>
            <div className="font-mono text-indigo-300 font-semibold bg-slate-900 px-2 py-1 rounded border border-slate-800 mt-0.5">
              {API_CONFIG.BASE_URL}
            </div>
          </div>
        </div>

        {/* Diagnostic Control Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Upload Box */}
          <div className="md:col-span-2 space-y-4 bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-400" />
              1. Pilih & Unggah File
            </h2>

            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center min-h-[180px] ${
                file
                  ? "border-indigo-500/50 bg-indigo-950/20"
                  : "border-slate-700 hover:border-slate-500 bg-slate-950/40"
              }`}
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <input
                id="fileInput"
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                onChange={handleFileChange}
              />

              {previewUrl ? (
                <div className="space-y-3 w-full flex flex-col items-center">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-40 rounded-lg shadow-md border border-slate-700 object-contain"
                  />
                  <div className="text-xs text-slate-300 font-mono">
                    {file?.name} ({(file?.size / 1024).toFixed(1)} KB)
                  </div>
                </div>
              ) : file ? (
                <div className="space-y-2">
                  <FileText className="w-12 h-12 text-indigo-400 mx-auto" />
                  <div className="text-sm font-semibold text-white">{file.name}</div>
                  <div className="text-xs text-slate-400 font-mono">
                    {file.type || "Document"} • {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <UploadCloud className="w-10 h-10 text-slate-500 mx-auto" />
                  <div className="text-sm text-slate-300 font-medium">
                    Klik atau tarik file gambar/PDF ke sini
                  </div>
                  <div className="text-xs text-slate-500">
                    JPG, PNG, WEBP, GIF, PDF (Maks. 10MB)
                  </div>
                </div>
              )}
            </div>

            {/* Upload Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Folder Target (Cloudinary / Supabase):
                </label>
                <input
                  type="text"
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="e.g. images, proposals, test-uploads"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  JWT Token Status ({tokenSource}):
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={customToken}
                    onChange={(e) => setCustomToken(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono pr-8"
                    placeholder="Auto-detected atau paste Bearer token"
                  />
                  <Key className="w-4 h-4 text-slate-500 absolute right-2.5 top-2.5" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-3">
              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-950/50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    Mengunggah ke Cloudinary...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    Uji Upload Sekarang
                  </>
                )}
              </button>
              {file && (
                <button
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                    setUploadedResult(null);
                    setErrorDetails(null);
                    setLogs([]);
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition"
                >
                  Reset
                </button>
              )}
            </div>

          </div>

          {/* Quick Info & Health Panel */}
          <div className="space-y-4 bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur flex flex-col justify-between">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Info Server & Cloudinary
              </h2>
              
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Cloud Name:</span>
                  <span className="font-mono text-emerald-400 font-bold">vzq8p7ot</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">API Key:</span>
                  <span className="font-mono text-slate-300">361676817915771</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Mode Upload:</span>
                  <span className="font-mono text-indigo-300 font-semibold">Signed SHA1</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Response Time:</span>
                  <span className="font-mono text-amber-300">{latency ? `${latency} ms` : "-"}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-200 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-indigo-400" /> Catatan Diagnostik
              </div>
              <p>
                Gambar diunggah via <code>/api/upload</code> backend yang mengeksekusi *Signed Upload* menggunakan HMAC SHA-1 key & secret ke Cloudinary CDN.
              </p>
            </div>
          </div>

        </div>

        {/* Live Execution Logs */}
        {logs.length > 0 && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2 mb-2 font-sans font-semibold">
              <span className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" /> Live Upload Console Logs
              </span>
              <span className="text-[11px] text-slate-500">{logs.length} events</span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
              {logs.map((log, index) => (
                <div key={index} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-600 select-none">[{log.timestamp}]</span>
                  <span
                    className={
                      log.type === "error"
                        ? "text-rose-400 font-semibold"
                        : log.type === "success"
                        ? "text-emerald-400 font-semibold"
                        : log.type === "warning"
                        ? "text-amber-400"
                        : "text-slate-300"
                    }
                  >
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Result View */}
        {uploadedResult && (
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-lg">
                <CheckCircle className="w-6 h-6" />
                Upload Gambar Berhasil!
              </div>
              <span className="text-xs bg-emerald-950 border border-emerald-800 text-emerald-300 px-3 py-1 rounded-full font-mono">
                200 OK • Cloudinary CDN
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Result Preview */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  File Preview (Cloudinary CDN Direct):
                </div>
                {resultUrl && (resultUrl.endsWith(".pdf") || file?.type === "application/pdf") ? (
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg text-center space-y-3">
                    <FileText className="w-12 h-12 text-rose-400 mx-auto" />
                    <div className="text-sm font-semibold text-slate-200">Dokumen PDF Terunggah</div>
                    <a
                      href={resultUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 underline"
                    >
                      Buka Dokumen PDF <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : resultUrl ? (
                  <div className="relative group bg-slate-950 border border-slate-800 rounded-lg p-2 flex justify-center">
                    <img
                      src={resultUrl}
                      alt="Uploaded result"
                      className="max-h-64 rounded object-contain border border-slate-800"
                    />
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic">No image URL returned</div>
                )}
              </div>

              {/* URL Details */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Hasil URL Resmi:
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-emerald-300 break-all select-all">
                  {resultUrl || JSON.stringify(uploadedResult)}
                </div>

                <div className="flex gap-2">
                  {resultUrl && (
                    <>
                      <button
                        onClick={() => copyToClipboard(resultUrl)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-2 px-3 rounded-lg border border-slate-700 transition flex items-center justify-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-400" /> Salin URL
                      </button>
                      <a
                        href={resultUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 text-center"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Buka di Tab Baru
                      </a>
                    </>
                  )}
                </div>

                <div className="pt-2">
                  <div className="text-xs font-semibold text-slate-400 mb-1">Raw API Payload:</div>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-400 overflow-x-auto max-h-36">
                    {JSON.stringify(uploadedResult, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Diagnostic Card */}
        {errorDetails && (
          <div className="bg-rose-950/30 border border-rose-500/40 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-lg">
                <AlertCircle className="w-6 h-6" />
                Upload Gagal ({errorDetails.status} {errorDetails.statusText})
              </div>
              <span className="text-xs bg-rose-950 border border-rose-800 text-rose-300 px-3 py-1 rounded-full font-mono">
                Diagnostic Feedback
              </span>
            </div>

            <div className="p-3 bg-slate-950 border border-rose-900/50 rounded-lg text-xs font-mono text-rose-300 leading-relaxed">
              {errorDetails.message}
            </div>

            {errorDetails.data && (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-400">Response JSON Server:</div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40">
                  {JSON.stringify(errorDetails.data, null, 2)}
                </pre>
              </div>
            )}

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Solusi & Langkah Troubleshooting:
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
                <li>
                  Jika muncul error <strong>400 Bad Request (Upload preset must be specified...)</strong>: Pastikan server backend sudah men-deploy file <code>CloudinaryService.cs</code> terbaru yang telah dikoreksi.
                </li>
                <li>
                  Jika muncul error <strong>401 Unauthorized</strong>: Pastikan Anda sudah login atau tempelkan JWT token di input &quot;JWT Token Status&quot;.
                </li>
                <li>
                  Jika <strong>Network Failure / CORS</strong>: Periksa apakah server Render backend (<code>{API_CONFIG.BASE_URL}</code>) sedang aktif atau mengalami cold-start.
                </li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
