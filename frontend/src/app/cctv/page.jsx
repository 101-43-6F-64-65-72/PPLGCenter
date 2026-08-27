"use client";

import React, { useState, useEffect, useCallback } from "react";
import cctvService from "@/services/cctvService";
import useAuth from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ErrorFallback from "@/components/ErrorFallback";
import { Camera, Radio, RefreshCw, ShieldAlert, PlusCircle, Power, Trash2, Search, CheckCircle2 } from "lucide-react";

export default function CctvPage() {
  const { isAuthenticated, user } = useAuth();
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discoveredCameras, setDiscoveredCameras] = useState([]);
  const [discovering, setDiscovering] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // null | "add" | "discover"
  const [alertMessage, setAlertMessage] = useState(null);

  // Form State
  const [camName, setCamName] = useState("");
  const [camLoc, setCamLoc] = useState("");
  const [camDesc, setCamDesc] = useState("");
  const [camHost, setCamHost] = useState("");
  const [camPort, setCamPort] = useState(554);
  const [camUsername, setCamUsername] = useState("admin");
  const [camPassword, setCamPassword] = useState("");

  const isStudent = user?.role === "Student";
  const isAdmin = user?.role === "Admin";

  const fetchCameras = useCallback(async () => {
    if (isStudent) return;
    try {
      setLoading(true);
      const res = await cctvService.getCameras();
      setCameras(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      console.error("Failed to fetch CCTV cameras:", err);
      setAlertMessage({ type: "error", text: err?.message || "Gagal memuat daftar kamera CCTV." });
    } finally {
      setLoading(false);
    }
  }, [isStudent]);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  const handleDiscover = async () => {
    try {
      setDiscovering(true);
      const res = await cctvService.discoverCameras();
      setDiscoveredCameras(Array.isArray(res) ? res : res?.data || []);
      setActiveModal("discover");
    } catch (err) {
      setAlertMessage({ type: "error", text: err?.message || "Gagal memindai perangkat ONVIF." });
    } finally {
      setDiscovering(false);
    }
  };

  const handleCreateCamera = async (e) => {
    e.preventDefault();
    if (!camName || !camLoc || !camHost) return;

    try {
      setAlertMessage(null);
      await cctvService.createCamera({
        name: camName,
        location: camLoc,
        description: camDesc,
        host: camHost,
        port: Number(camPort),
        username: camUsername,
        password: camPassword,
      });

      setAlertMessage({ type: "success", text: "Kamera CCTV berhasil terdaftar & diverifikasi!" });
      setActiveModal(null);
      resetForm();
      fetchCameras();
    } catch (err) {
      setAlertMessage({ type: "error", text: err?.message || "Gagal mengaitkan kamera CCTV." });
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      setAlertMessage(null);
      await cctvService.toggleCamera(id, !currentStatus);
      fetchCameras();
    } catch (err) {
      setAlertMessage({ type: "error", text: err?.message || "Gagal mengubah status aktif kamera." });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kamera CCTV ini?")) return;
    try {
      setAlertMessage(null);
      await cctvService.deleteCamera(id);
      fetchCameras();
    } catch (err) {
      setAlertMessage({ type: "error", text: err?.message || "Gagal menghapus kamera CCTV." });
    }
  };

  const resetForm = () => {
    setCamName("");
    setCamLoc("");
    setCamDesc("");
    setCamHost("");
    setCamPort(554);
    setCamUsername("admin");
    setCamPassword("");
  };

  const selectDiscovered = (device) => {
    setCamName(device.deviceName);
    setCamLoc("Lab Komputer PPLG");
    setCamHost(device.ipAddress);
    setCamPort(device.port || 554);
    setActiveModal("add");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans selection:bg-[#2C1EE8] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 space-y-4 text-left">
        {/* Top Direct Action Toolbar */}
        <div className="bg-white border border-slate-200 rounded-none p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#2C1EE8]" />
              <span>Sistem Pemantauan CCTV Laboratorium PPLG</span>
            </h1>
            <p className="text-xs text-slate-500 font-normal">
              Pemantauan kamera IP & WebRTC live stream lingkungan Laboratorium Rekayasa Perangkat Lunak.
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleDiscover}
                disabled={discovering}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-none transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-[#2C1EE8]" />
                <span>{discovering ? "Memindai..." : "Pindai LAN"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveModal("add");
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white font-bold text-xs uppercase tracking-wider rounded-none transition-colors shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Tambah Kamera</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Alert Notification */}
        {alertMessage && (
          <div
            className={`p-3 rounded-none text-xs font-semibold border flex items-center justify-between gap-3 ${
              alertMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <span>{alertMessage.text}</span>
            <button
              onClick={() => setAlertMessage(null)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
            >
              ✕
            </button>
          </div>
        )}

        {isStudent ? (
          <div className="py-6 w-full flex justify-center">
            <ErrorFallback
              statusCode={403}
              title="Akses CCTV Dibatasi"
              description="Sistem pemantauan CCTV terbatas hanya untuk Pengawas Laboratorium, Guru, dan Administrator Sistem."
              primaryAction={{ label: "Kembali ke Beranda", href: "/" }}
              showHomeButton={false}
              fullPage={false}
            />
          </div>
        ) : loading ? (
          <div className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
            <div className="w-5 h-5 border-2 border-[#2C1EE8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Memuat daftar kamera CCTV...
          </div>
        ) : cameras.length === 0 ? (
          <div className="py-6 w-full flex justify-center">
            <ErrorFallback
              statusCode="EMPTY"
              title="Belum Ada Kamera CCTV"
              description="Belum ada kamera CCTV terdaftar di lingkungan laboratorium sekolah."
              primaryAction={{ label: "Kembali ke Beranda", href: "/" }}
              showHomeButton={false}
              fullPage={false}
            />
          </div>
        ) : (
          /* Camera Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cameras.map((cam) => (
              <div
                key={cam.id}
                className="bg-white border border-slate-200 rounded-none overflow-hidden flex flex-col shadow-xs"
              >
                {/* Camera Video Stream Window */}
                <div className="relative bg-black aspect-video flex items-center justify-center border-b border-slate-200 group">
                  <div className="text-center p-4">
                    <Radio className="w-6 h-6 text-[#2C1EE8] animate-pulse mx-auto mb-2" />
                    <span className="text-xs font-mono text-white font-bold uppercase">Live Stream WebRTC (WHEP)</span>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">Host: {cam.host}:{cam.port}</p>
                  </div>

                  <div className={`absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 bg-black/80 border border-slate-700 rounded-none text-[9.5px] font-bold font-mono ${
                    cam.status === "Online" || cam.status === 0
                      ? "text-emerald-400"
                      : cam.status === "Discovered" || cam.status === 6
                      ? "text-cyan-400"
                      : cam.status === "PendingVerification" || cam.status === 7
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-none ${
                      cam.status === "Online" || cam.status === 0 ? "bg-emerald-500 animate-ping" : "bg-slate-500"
                    }`} />
                    <span>
                      {cam.status === 0 || cam.status === "Online"
                        ? "ONLINE"
                        : cam.status === 6 || cam.status === "Discovered"
                        ? "DISCOVERED"
                        : cam.status === 7 || cam.status === "PendingVerification"
                        ? "PENDING"
                        : cam.status === 8 || cam.status === "Error"
                        ? "ERROR"
                        : cam.status === 1 || cam.status === "Offline"
                        ? "OFFLINE"
                        : "DEGRADED"}
                    </span>
                  </div>
                </div>

                {/* Camera Information & Actions */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase truncate">{cam.name}</h3>
                      <span
                        className={`text-[9.5px] px-1.5 py-0.2 rounded-none font-mono font-bold uppercase border ${
                          cam.isEnabled
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {cam.isEnabled ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-normal">Lokasi: {cam.location}</p>
                    {cam.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 font-normal">{cam.description}</p>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleToggle(cam.id, cam.isEnabled)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                          cam.isEnabled
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{cam.isEnabled ? "Matikan" : "Aktifkan"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(cam.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Hapus Kamera"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Discovery Modal */}
      {activeModal === "discover" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-none max-w-lg w-full p-5 sm:p-6 text-slate-900 shadow-xl space-y-3 text-left">
            <h3 className="text-base font-bold text-slate-900 uppercase flex items-center gap-2">
              <Search className="w-4 h-4 text-[#2C1EE8]" />
              <span>Perangkat CCTV ONVIF di LAN</span>
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {discoveredCameras.map((dev, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-none flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900 uppercase">{dev.deviceName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {dev.manufacturer} ({dev.model}) • IP: {dev.ipAddress}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectDiscovered(dev)}
                    className="px-3 py-1 bg-[#2C1EE8] hover:bg-[#2013ce] text-white font-bold text-[10.5px] uppercase tracking-wider rounded-none cursor-pointer"
                  >
                    Pilih
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-none text-xs font-bold uppercase tracking-wider text-slate-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Camera Modal */}
      {activeModal === "add" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-none max-w-md w-full p-5 sm:p-6 text-slate-900 shadow-xl space-y-3 text-left">
            <h3 className="text-base font-bold text-slate-900 uppercase">Tambah Kamera CCTV Baru</h3>

            <form onSubmit={handleCreateCamera} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider">Nama Kamera <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kamera Lab PPLG 1"
                  value={camName}
                  onChange={(e) => setCamName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-2 text-slate-900 focus:border-[#2C1EE8] focus:bg-white outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider">Lokasi Penempatan <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Lab Komputer A"
                  value={camLoc}
                  onChange={(e) => setCamLoc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-2 text-slate-900 focus:border-[#2C1EE8] focus:bg-white outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider">Host IP (LAN) <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="192.168.10.101"
                    value={camHost}
                    onChange={(e) => setCamHost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-2 text-slate-900 font-mono focus:border-[#2C1EE8] focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider">Port RTSP</label>
                  <input
                    type="number"
                    required
                    value={camPort}
                    onChange={(e) => setCamPort(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-2 text-slate-900 font-mono focus:border-[#2C1EE8] focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider">Username</label>
                  <input
                    type="text"
                    required
                    value={camUsername}
                    onChange={(e) => setCamUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-2 text-slate-900 font-mono focus:border-[#2C1EE8] focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={camPassword}
                    onChange={(e) => setCamPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-2 text-slate-900 font-mono focus:border-[#2C1EE8] focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-none font-bold uppercase tracking-wider text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white rounded-none font-bold uppercase tracking-wider text-xs cursor-pointer shadow-xs"
                >
                  Simpan Kamera
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
