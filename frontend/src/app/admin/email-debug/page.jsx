"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthGuard from "@/components/layout/AuthGuard";
import { USER_ROLES } from "@/constants/userRoles";
import emailService from "@/services/emailService";
import {
  Mail,
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Server,
  Terminal,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Eye,
  X,
  Sparkles,
  Layers,
  Globe
} from "lucide-react";

export default function AdminEmailDebugPage() {
  return (
    <AuthGuard allowedRoles={[USER_ROLES.ADMIN]}>
      <EmailDebugContent />
    </AuthGuard>
  );
}

function EmailDebugContent() {
  // Config Status State
  const [configStatus, setConfigStatus] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Form State
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("Test Replyz Notification");
  const [message, setMessage] = useState("Halo, ini adalah pesan test notifikasi otomatis dari sistem Replyz@pplgcenter.web.id.");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null); // { type: 'success' | 'error', text: string, details?: any }

  // Logs Table State
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal Detail State
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedResponse, setCopiedResponse] = useState(false);

  // Quick Templates
  const templates = [
    {
      name: "Default Test",
      subject: "Test Replyz Notification - PPLG Center",
      message: "Halo! Ini adalah email percobaan untuk memverifikasi sistem notifikasi Replyz@pplgcenter.web.id telah terhubung dan aktif.",
    },
    {
      name: "Notifikasi Tugas Siswa",
      subject: "[PPLG Center] Tugas Baru: Pemrograman Web Lanjutan",
      message: "Yth. Siswa PPLG,\n\nAda tugas baru yang telah diterbitkan pada mata pelajaran Pemrograman Web. Batas pengumpulan: Minggu, 23:59 WIB.\n\nSilakan periksa portal PPLG Center untuk instruksi lengkap.\n\nSalam,\nReplyz (PPLG Center)",
    },
    {
      name: "Pemberitahuan Sistem",
      subject: "[PPLG Center] Maintenance Terjadwal Server",
      message: "Pemberitahuan kepada seluruh pengguna bahwa akan ada pemeliharaan server berkala pada akhir pekan ini. Layanan tetap dapat diakses normal setelah proses selesai.\n\nTerima kasih atas perhatian Anda.",
    },
  ];

  // Fetch Config Status
  const fetchConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const data = await emailService.getConfigStatus();
      setConfigStatus(data);
    } catch (err) {
      console.error("Failed to load email config:", err);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  // Fetch Logs
  const fetchLogs = useCallback(async (targetPage = 1, search = searchTerm) => {
    setLoadingLogs(true);
    try {
      const data = await emailService.getEmailLogs({ page: targetPage, pageSize: 15, search });
      setLogs(data.items || []);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalItems || 0);
    } catch (err) {
      console.error("Failed to load email logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchConfig();
    fetchLogs(1);
  }, [fetchConfig, fetchLogs]);

  // Handle Send Test Email
  async function handleSendEmail(e) {
    e.preventDefault();
    if (!toEmail.trim()) {
      setSendResult({ type: "error", text: "Alamat email tujuan wajib diisi." });
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const result = await emailService.sendTestEmail({
        to: toEmail.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });

      setSendResult({
        type: "success",
        text: `✓ Email berhasil dikirim via provider ${result?.provider || "Email"}! ID: ${result?.messageId || result?.emailLogId || "OK"}`,
        details: result,
      });

      // Refresh log list after sending
      fetchLogs(1);
    } catch (err) {
      console.error("Error sending test email:", err);
      const errMsg = err?.response?.data?.message || err?.message || "Gagal mengirim email ke provider.";
      setSendResult({
        type: "error",
        text: `✕ Email gagal dikirim: ${errMsg}`,
        details: err?.response?.data?.data,
      });
      // Still refresh logs to show failed record in DB
      fetchLogs(1);
    } finally {
      setSending(false);
    }
  }

  function handleCopyResponse(content) {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <div className="flex-1 w-full max-w-[1400px] mx-auto pt-20 lg:pt-24 min-h-[calc(100vh-6rem)] px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6">
        
        {/* Header Navigation Breadcrumb & Title */}
        <div className="bg-white/80 backdrop-blur-md rounded-[24px] border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                <Link href="/admin" className="hover:text-[#2C1EE8] transition-colors flex items-center gap-1">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </Link>
                <span>/</span>
                <span className="text-[#2C1EE8]">Email Debugger</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2C1EE8] flex items-center justify-center border border-blue-100">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    Email Notification Debugger
                  </h1>
                  <p className="text-xs text-slate-500">
                    Pengujian pengiriman notifikasi email sistem via custom domain <span className="font-semibold text-slate-700 font-mono">bot@pplgcenter.web.id</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-extrabold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Admin Isolated Area</span>
              </span>
            </div>
          </div>
        </div>

        {/* System & Provider Configuration Status Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-md rounded-[20px] border border-slate-200/80 p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-[#2C1EE8] flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Sender Address</span>
              <p className="text-xs font-black text-slate-800 truncate font-mono">
                {configStatus?.sender || "bot@pplgcenter.web.id"}
              </p>
              <span className="text-[10px] text-slate-500">
                {configStatus?.senderName || "PPLG Center Bot"}
              </span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-[20px] border border-slate-200/80 p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Active Provider</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-block w-2 h-2 rounded-full ${
                  configStatus?.configuredProvider?.includes("Resend") || configStatus?.configuredProvider === "SMTP"
                    ? "bg-emerald-500 ring-2 ring-emerald-100"
                    : "bg-amber-500 ring-2 ring-amber-100"
                }`} />
                <span className="text-xs font-black text-slate-800">
                  {loadingConfig ? "Checking..." : (configStatus?.configuredProvider || "Not Configured")}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                {configStatus?.isResendAvailable ? "Resend API Ready" : (configStatus?.isSmtpAvailable ? "SMTP Ready" : "Set API Key in env")}
              </span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-[20px] border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Environment</span>
                <span className="text-xs font-black text-slate-800">
                  {configStatus?.environment || "Development / Localhost"}
                </span>
                <p className="text-[10px] text-slate-500">Direct dispatch to destination</p>
              </div>
            </div>
            <button
              onClick={() => { fetchConfig(); fetchLogs(1); }}
              title="Refresh Status"
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loadingConfig || loadingLogs ? "animate-spin text-[#2C1EE8]" : ""}`} />
            </button>
          </div>
        </div>

        {/* Main Content Grid: Test Email Form & DNS Notice */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Form Card (7 cols) */}
          <div className="lg:col-span-7 bg-white/80 backdrop-blur-md rounded-[24px] border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#2C1EE8]" />
                  <span>Kirim Test Email</span>
                </h2>
                <p className="text-xs text-slate-500">Uji coba pengiriman email ke alamat inbox Anda.</p>
              </div>

              {/* Quick Template Picker */}
              <div className="flex items-center gap-1">
                {templates.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSubject(tpl.subject);
                      setMessage(tpl.message);
                    }}
                    className="text-[10px] font-bold text-slate-600 hover:text-[#2C1EE8] bg-slate-100 hover:bg-blue-50 px-2 py-1 rounded-md border border-slate-200 transition cursor-pointer"
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Result Banner */}
            {sendResult && (
              <div
                className={`p-4 rounded-xl border text-xs font-semibold flex items-start gap-3 transition-all ${
                  sendResult.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                }`}
              >
                {sendResult.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  <p className="font-extrabold">{sendResult.text}</p>
                  {sendResult.details?.providerResponse && (
                    <p className="font-mono text-[10px] text-slate-600 bg-white/60 p-1.5 rounded border border-slate-200 truncate">
                      {sendResult.details.providerResponse}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSendResult(null)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSendEmail} className="space-y-4">
              {/* Recipient Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                  <span>Alamat Email Penerima (To) *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Pastikan dapat menerima email</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="contoh: namaanda@gmail.com"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#2C1EE8] focus:ring-2 focus:ring-blue-100 transition shadow-2xs font-mono"
                />
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                  <span>Subjek Email *</span>
                  <span className="text-[10px] text-slate-400">{subject.length}/200</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  placeholder="Subjek notifikasi..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#2C1EE8] focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
                />
              </div>

              {/* Message Content */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                  <span>Isi Pesan (Body) *</span>
                  <span className="text-[10px] text-slate-400">{message.length}/5000</span>
                </label>
                <textarea
                  required
                  rows={5}
                  maxLength={5000}
                  placeholder="Tulis pesan pengujian di sini..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#2C1EE8] focus:ring-2 focus:ring-blue-100 transition shadow-2xs resize-y"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={sending}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                    sending
                      ? "bg-slate-400 cursor-not-allowed shadow-none"
                      : "bg-[#2C1EE8] hover:bg-indigo-700 shadow-blue-900/20 active:scale-[0.99]"
                  }`}
                >
                  {sending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending... (Mengirim ke Provider)</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Test Email</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* DNS & Provider Setup Guide Card (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white/80 backdrop-blur-md rounded-[24px] border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2C1EE8] flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  Panduan DNS Custom Domain
                </h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Untuk memastikan email dari <span className="font-mono font-bold text-slate-800">bot@pplgcenter.web.id</span> masuk ke Inbox (bukan Spam/Junk), pastikan DNS record domain diverifikasi pada provider yang digunakan:
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>1. SPF (Sender Policy Framework)</span>
                    <span className="text-[10px] bg-blue-100 text-[#2C1EE8] px-1.5 py-0.5 rounded font-mono">TXT Record</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Memberikan izin kepada server provider untuk mengirim email atas nama <code className="text-slate-700">pplgcenter.web.id</code>.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>2. DKIM (DomainKeys Identified Mail)</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono">CNAME / TXT</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Kunci tanda tangan kriptografi digital dari provider (misal Resend/Mailgun/Brevo).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>3. DMARC</span>
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-mono">TXT _dmarc</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Kebijakan proteksi domain dari spoofing/phishing.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Catatan:</strong> Jangan menebak record DNS. Masukkan record DNS persis seperti yang diberikan di dashboard provider email Anda.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Email Logs Table Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-[24px] border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#2C1EE8]" />
                <span>Riwayat Pengiriman Email (Logs)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Total {totalItems} pengiriman tercatat di database sistem.
              </p>
            </div>

            {/* Search & Refresh Tools */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Cari penerima / subjek..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") fetchLogs(1, searchTerm); }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#2C1EE8] focus:bg-white transition"
              />
              <button
                onClick={() => fetchLogs(1, searchTerm)}
                className="px-3 py-1.5 rounded-xl bg-[#2C1EE8] text-white text-xs font-bold hover:bg-indigo-700 transition cursor-pointer"
              >
                Cari
              </button>
              <button
                onClick={() => { setSearchTerm(""); fetchLogs(1, ""); }}
                title="Reset & Refresh"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin text-[#2C1EE8]" : ""}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/50 text-slate-500 font-extrabold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3">Waktu</th>
                  <th className="py-3 px-3">Penerima</th>
                  <th className="py-3 px-3">Subjek</th>
                  <th className="py-3 px-3">Provider</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loadingLogs ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#2C1EE8]" />
                      <span>Memuat riwayat log email...</span>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      <Mail className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                      <span>Belum ada log pengiriman email.</span>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isSent = log.status === "Sent" || log.status === 1;
                    const isFailed = log.status === "Failed" || log.status === 2;
                    const isPending = log.status === "Pending" || log.status === 0;

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="py-3 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                          }) : "-"}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {log.recipient}
                          {log.recipientUserFullName && (
                            <span className="block text-[10px] text-slate-500 font-sans font-normal">
                              ({log.recipientUserFullName})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 max-w-[280px] truncate text-slate-800">
                          {log.subject}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {log.provider}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {isSent && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>SENT</span>
                            </span>
                          )}
                          {isFailed && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-extrabold text-[10px]">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>FAILED</span>
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-extrabold text-[10px]">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>PENDING</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#2C1EE8] hover:text-white text-slate-600 text-[11px] font-bold transition cursor-pointer"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
              <span>Halaman {page} dari {totalPages} ({totalItems} total entri)</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => fetchLogs(page - 1)}
                  className={`p-1.5 rounded-lg border border-slate-200 ${
                    page <= 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-100 cursor-pointer"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => fetchLogs(page + 1)}
                  className={`p-1.5 rounded-lg border border-slate-200 ${
                    page >= totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-100 cursor-pointer"
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Detail Log */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2C1EE8] flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900">Detail Log Pengiriman Email</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">ID Log</span>
                <span className="font-mono text-slate-700 text-[11px] break-all">{selectedLog.id}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Status</span>
                <span className="font-bold text-slate-800">{selectedLog.status}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Sender</span>
                <span className="font-mono text-slate-700">{selectedLog.sender}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Recipient</span>
                <span className="font-mono text-slate-700 font-bold">{selectedLog.recipient}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Waktu Dibuat</span>
                <span className="text-slate-700">{new Date(selectedLog.createdAt).toLocaleString("id-ID")}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Waktu Terkirim (SentAt)</span>
                <span className="text-slate-700">{selectedLog.sentAt ? new Date(selectedLog.sentAt).toLocaleString("id-ID") : "-"}</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Subjek Email</span>
              <div className="p-3 bg-slate-50 rounded-xl font-bold text-slate-900 border border-slate-200/60">
                {selectedLog.subject}
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Isi Pesan</span>
              <div className="p-3 bg-slate-50 rounded-xl text-slate-800 whitespace-pre-wrap font-sans text-xs border border-slate-200/60 max-h-48 overflow-y-auto">
                {selectedLog.message}
              </div>
            </div>

            {selectedLog.errorMessage && (
              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider block">Error Provider Message</span>
                <div className="p-3 bg-rose-50 text-rose-900 rounded-xl font-mono text-[11px] border border-rose-200 break-all">
                  {selectedLog.errorMessage}
                </div>
              </div>
            )}

            {selectedLog.providerResponse && (
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Raw Provider Response</span>
                  <button
                    onClick={() => handleCopyResponse(selectedLog.providerResponse)}
                    className="text-[10px] font-bold text-[#2C1EE8] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedResponse ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedResponse ? "Tersalin!" : "Salin JSON"}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[10px] overflow-x-auto max-h-40">
                  {selectedLog.providerResponse}
                </pre>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
