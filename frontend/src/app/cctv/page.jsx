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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6 gap-4">
          <div>
            <span className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold rounded-full mb-2">
              Keamanan & Pemantauan Lab PPLG
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Camera className="w-8 h-8 text-cyan-400" />
              <span>Sistem Pemantauan CCTV Subsystem</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Pemantauan kamera IP & WebRTC live stream lingkungan Laboratorium Rekayasa Perangkat Lunak.
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleDiscover}
                disabled={discovering}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>{discovering ? "Pindai ONVIF..." : "Pindai Perangkat LAN"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveModal("add");
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-cyan-600/20 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tambah Kamera</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Alert */}
        {alertMessage && (
          <div
            className={`p-4 rounded-xl text-xs sm:text-sm font-semibold border ${
              alertMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            {alertMessage.text}
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
          <div className="py-20 text-center text-slate-500 text-xs">Memuat daftar kamera CCTV...</div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cameras.map((cam) => (
              <div
                key={cam.id}
                className="bg-slate-800/50 border border-slate-700/60 rounded-2xl overflow-hidden flex flex-col shadow-xl"
              >
                {/* Camera Video Stream Window */}
                <div className="relative bg-slate-950 aspect-video flex items-center justify-center border-b border-slate-700/50 group">
                  <div className="text-center p-4">
                    <Radio className="w-8 h-8 text-cyan-400 animate-pulse mx-auto mb-2" />
                    <span className="text-xs font-mono text-cyan-300 font-bold">Live Stream WebRTC (WHEP)</span>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">Host: {cam.host}:{cam.port}</p>
                  </div>

                  <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg text-[10px] font-bold ${
                    cam.status === "Online" || cam.status === 0
                      ? "text-emerald-400"
                      : cam.status === "Discovered" || cam.status === 6
                      ? "text-cyan-400"
                      : cam.status === "PendingVerification" || cam.status === 7
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      cam.status === "Online" || cam.status === 0 ? "bg-emerald-500 animate-ping" : "bg-slate-500"
                    }`} />
                    <span>
                      {cam.status === 0 || cam.status === "Online"
                        ? "ONLINE"
                        : cam.status === 6 || cam.status === "Discovered"
                        ? "DISCOVERED"
                        : cam.status === 7 || cam.status === "PendingVerification"
                        ? "PENDING VERIFICATION"
                        : cam.status === 8 || cam.status === "Error"
                        ? "ERROR"
                        : cam.status === 1 || cam.status === "Offline"
                        ? "OFFLINE"
                        : "DEGRADED"}
                    </span>
                  </div>

                </div>

                {/* Camera Information & Actions */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-white text-sm">{cam.name}</h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          cam.isEnabled
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-700 text-slate-400"
                        }`}
                      >
                        {cam.isEnabled ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Lokasi: {cam.location}</p>
                    {cam.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{cam.description}</p>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleToggle(cam.id, cam.isEnabled)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          cam.isEnabled
                            ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{cam.isEnabled ? "Matikan" : "Aktifkan"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(cam.id)}
                        className="p-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white transition-all cursor-pointer"
                        title="Hapus Kamera"
                      >
                        <Trash2 className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-cyan-400" />
              <span>Perangkat CCTV ONVIF Ditemukan di LAN</span>
            </h3>

            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {discoveredCameras.map((dev, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-900/80 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-white">{dev.deviceName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {dev.manufacturer} ({dev.model}) • IP: {dev.ipAddress}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectDiscovered(dev)}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] rounded-xl cursor-pointer"
                  >
                    Pilih
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Camera Modal */}
      {activeModal === "add" && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Tambah Kamera CCTV Baru</h3>

            <form onSubmit={handleCreateCamera} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nama Kamera:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kamera Lab PPLG 1"
                  value={camName}
                  onChange={(e) => setCamName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Lokasi Penempatan:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Lab Komputer A"
                  value={camLoc}
                  onChange={(e) => setCamLoc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1 font-semibold">Host IP (Privat LAN):</label>
                  <input
                    type="text"
                    required
                    placeholder="192.168.10.101"
                    value={camHost}
                    onChange={(e) => setCamHost(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Port RTSP:</label>
                  <input
                    type="number"
                    required
                    value={camPort}
                    onChange={(e) => setCamPort(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Username Kamera:</label>
                  <input
                    type="text"
                    required
                    value={camUsername}
                    onChange={(e) => setCamUsername(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Password Kamera:</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={camPassword}
                    onChange={(e) => setCamPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold text-white cursor-pointer"
                >
                  Simpan & Verifikasi
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
