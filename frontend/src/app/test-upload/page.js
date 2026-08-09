"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthGuard from "@/components/layout/AuthGuard";
import { getStoredToken } from "@/lib/api";
import { uploadPdfDocument, uploadImageToCloudinary } from "@/services/cloudinaryService";
import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Image as ImageIcon,
  ShieldCheck,
  FileCheck,
} from "lucide-react";

function TestUploadPageContent() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfFolder, setPdfFolder] = useState("proposals");
  const [isPdfUploading, setIsPdfUploading] = useState(false);
  const [pdfResult, setPdfResult] = useState(null);
  const [pdfError, setPdfError] = useState("");

  const [imgFile, setImgFile] = useState(null);
  const [isImgUploading, setIsImgUploading] = useState(false);
  const [imgResultUrl, setImgResultUrl] = useState("");
  const [imgError, setImgError] = useState("");

  const token = typeof window !== "undefined" ? getStoredToken() : null;

  const handlePdfUpload = async (e) => {
    e.preventDefault();
    if (!pdfFile) {
      setPdfError("Pilih file PDF terlebih dahulu.");
      return;
    }

    if (!pdfFile.name.toLowerCase().endsWith(".pdf")) {
      setPdfError("File harus berformat PDF.");
      return;
    }

    if (pdfFile.size > 10 * 1024 * 1024) {
      setPdfError("Ukuran file melebihi batas 10 MB.");
      return;
    }

    setIsPdfUploading(true);
    setPdfError("");
    setPdfResult(null);

    try {
      const res = await uploadPdfDocument(pdfFile, pdfFolder);
      if (res?.path || res?.url) {
        setPdfResult(res);
      } else {
        setPdfError("Gagal mengunggah dokumen PDF. Pastikan backend terhubung.");
      }
    } catch (err) {
      setPdfError(err?.message || "Terjadi kesalahan saat mengunggah PDF.");
    } finally {
      setIsPdfUploading(false);
    }
  };

  const handleImgUpload = async (e) => {
    e.preventDefault();
    if (!imgFile) {
      setImgError("Pilih file gambar terlebih dahulu.");
      return;
    }

    setIsImgUploading(true);
    setImgError("");
    setImgResultUrl("");

    try {
      const url = await uploadImageToCloudinary(imgFile);
      if (url) {
        setImgResultUrl(url);
      } else {
        setImgError("Gagal mengunggah gambar.");
      }
    } catch (err) {
      setImgError(err?.message || "Terjadi kesalahan saat mengunggah gambar.");
    } finally {
      setIsImgUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 space-y-10">
        {/* Header Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-[#2C1EE8] border border-indigo-100 mb-2">
                <ShieldCheck className="w-3.5 h-3.5" /> Direct Testing Module
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Pengujian Upload Dokumen & Storage
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Halaman diagnostik untuk menguji pengunggahan dokumen PDF (Supabase Storage) dan gambar.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Auth Token Status: {token ? "Terautentikasi (JWT Present)" : "Belum Login"}
            </div>
          </div>
        </div>

        {/* Dual Grid Testing Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* TEST 1: PDF SUPABASE STORAGE UPLOAD */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-[#2C1EE8]">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Uji Upload PDF (Supabase Storage)</h2>
                  <p className="text-xs text-slate-500">Menyimpan Object Path privat di DB & menggenerasi Signed URL</p>
                </div>
              </div>

              <form onSubmit={handlePdfUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pilih Target Folder Sub-bucket:
                  </label>
                  <select
                    value={pdfFolder}
                    onChange={(e) => setPdfFolder(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium bg-slate-50 focus:bg-white focus:border-[#2C1EE8] focus:outline-none"
                  >
                    <option value="proposals">proposals/ (Proposal Kegiatan)</option>
                    <option value="materials">materials/ (Materi Pembelajaran)</option>
                    <option value="submissions">submissions/ (Tugas Siswa)</option>
                    <option value="documents">documents/ (Dokumen Umum)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pilih Dokumen PDF (Maksimal 10 MB):
                  </label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      setPdfFile(e.target.files?.[0] || null);
                      setPdfError("");
                    }}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-[#2C1EE8] hover:file:bg-indigo-100 border border-slate-200 rounded-xl cursor-pointer"
                  />
                </div>

                {pdfFile && (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs flex items-center justify-between">
                    <span className="font-semibold text-slate-800 truncate max-w-[200px]">{pdfFile.name}</span>
                    <span className="text-slate-500">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPdfUploading || !pdfFile}
                  className="w-full py-3 px-5 rounded-2xl bg-[#2C1EE8] text-white text-xs sm:text-sm font-bold hover:bg-[#2013ce] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98"
                >
                  {isPdfUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengunggah dokumen...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Unggah PDF ke Supabase Storage</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Error / Result Display */}
            <div className="space-y-3">
              {pdfError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{pdfError}</span>
                </div>
              )}

              {pdfResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs space-y-3">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Dokumen Berhasil Diunggah!</span>
                  </div>

                  <div className="space-y-1.5 font-mono text-[11px] bg-white p-3 rounded-xl border border-emerald-200/60 break-all">
                    <div>
                      <span className="text-slate-400 font-sans block text-[10px] font-bold uppercase tracking-wider">
                        Storage Object Path (Disimpan di DB):
                      </span>
                      <span className="text-indigo-600 font-bold">{pdfResult.path}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-400 font-sans block text-[10px] font-bold uppercase tracking-wider">
                        Temporary Signed URL (Berlaku 60 menit):
                      </span>
                      <a
                        href={pdfResult.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 underline inline-flex items-center gap-1 hover:text-emerald-900 font-bold"
                      >
                        Buka PDF di Tab Baru <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {pdfResult.url && (
                    <div className="pt-2">
                      <iframe
                        src={pdfResult.url}
                        className="w-full h-48 rounded-xl border border-slate-200 shadow-inner bg-slate-100"
                        title="Live PDF Preview"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* TEST 2: IMAGE UPLOAD */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Uji Upload Gambar</h2>
                  <p className="text-xs text-slate-500">Memastikan fitur pengunggahan gambar tetap bekerja</p>
                </div>
              </div>

              <form onSubmit={handleImgUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pilih File Gambar (JPG, PNG, WEBP, GIF):
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      setImgFile(e.target.files?.[0] || null);
                      setImgError("");
                    }}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-rose-50 file:text-rose-600 hover:file:bg-rose-100 border border-slate-200 rounded-xl cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isImgUploading || !imgFile}
                  className="w-full py-3 px-5 rounded-2xl bg-slate-900 text-white text-xs sm:text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
                >
                  {isImgUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengunggah gambar...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Unggah Gambar</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Error / Result Display */}
            <div className="space-y-3">
              {imgError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{imgError}</span>
                </div>
              )}

              {imgResultUrl && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs space-y-3">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>Gambar Berhasil Diunggah!</span>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200 max-h-48 bg-slate-100 flex items-center justify-center">
                    <img src={imgResultUrl} alt="Preview" className="max-h-48 object-contain" />
                  </div>

                  <div className="break-all font-mono text-[11px] bg-white p-2.5 rounded-xl border border-emerald-200/60">
                    <a
                      href={imgResultUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 underline font-bold"
                    >
                      {imgResultUrl}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function TestUploadPage() {
  return (
    <AuthGuard>
      <TestUploadPageContent />
    </AuthGuard>
  );
}
