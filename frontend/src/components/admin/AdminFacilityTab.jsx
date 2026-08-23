"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Search,
  Eye,
  Plus,
  Pencil,
  Trash2,
  Package,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  X,
  Save,
  MapPin,
  Users,
  Tag,
  Image as ImageIcon,
  AlignLeft,
  ChevronDown,
  ArrowRight,
  Box,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import facilityService from "@/services/facilityService";
import userService from "@/services/userService";
import apiClient from "@/lib/api";
import { resolveImageUrl } from "@/lib/utils";
import STORAGE_3D_MODELS from "@/config/storage3dModels";
import DesktopComputerViewer3D from "@/components/common/DesktopComputerViewer3D";

// ─────────────────────────────────────────────
// Modal Tambah / Edit Fasilitas
// ─────────────────────────────────────────────
function FacilityFormModal({ facility, onClose, onSaved }) {
  const isEdit = !!facility;
  const [form, setForm] = useState({
    name: facility?.name || facility?.Name || "",
    description: facility?.description || facility?.Description || "",
    location: facility?.location || facility?.Location || "",
    capacity: facility?.capacity ?? facility?.Capacity ?? "",
    imageUrl: facility?.imageUrl || facility?.ImageUrl || "",
    model3dUrl: facility?.model3dUrl || facility?.Model3dUrl || facility?.model3DUrl || facility?.Model3DUrl || "",
    category: facility?.category || facility?.Category || "",
    isActive: facility?.isActive ?? facility?.IsActive ?? true,
    managerTeacherId: facility?.managerTeacherId || facility?.ManagerTeacherId || "",
  });
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [show3DPreview, setShow3DPreview] = useState(false);

  useEffect(() => {
    // Fetch teachers list for manager selection
    const fetchTeachers = async () => {
      try {
        const res = await userService.getTeachers();
        let list = [];
        if (res?.data) {
          list = Array.isArray(res.data) ? res.data : (res.data.items || []);
        } else if (Array.isArray(res)) {
          list = res;
        }
        setTeachers(list);
      } catch (err) {
        console.error("Failed to load teachers for facility manager dropdown:", err);
      }
    };
    fetchTeachers();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Nama fasilitas wajib diisi.");
    if (!form.location.trim()) return setError("Lokasi wajib diisi.");
    if (!form.capacity || Number(form.capacity) < 1) return setError("Kapasitas minimal 1.");

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        location: form.location.trim(),
        capacity: Number(form.capacity),
        imageUrl: form.imageUrl.trim() || null,
        model3dUrl: form.model3dUrl.trim() || null,
        model3DUrl: form.model3dUrl.trim() || null,
        Model3DUrl: form.model3dUrl.trim() || null,
        category: form.category.trim() || null,
        isActive: form.isActive,
        managerTeacherId: form.managerTeacherId || null,
      };

      if (isEdit) {
        await facilityService.updateFacility(facility.id, payload);
      } else {
        await facilityService.createFacility(payload);
      }
      onSaved();
    } catch (err) {
      setError(err?.message || "Gagal menyimpan fasilitas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[28px] border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md rounded-t-[28px] z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-[#2C1EE8]">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              {isEdit ? "Edit Fasilitas" : "Tambah Fasilitas Baru"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Nama */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Fasilitas / Barang <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="cth. Lab Komputer, Aula Utama, atau Proyektor Epson HD"
                maxLength={100}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#2C1EE8] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {/* Lokasi / Tempat Penyimpanan */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Lokasi / Posisi Penyimpanan <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="cth. Lantai 1 Gedung A, Ruang Lab 1, atau Gudang Sarpras"
                maxLength={200}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#2C1EE8] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {/* Kapasitas / Stok Unit & Kategori */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Kapasitas / Stok Unit <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="capacity"
                  type="number"
                  min="1"
                  max="10000"
                  value={form.capacity}
                  onChange={handleChange}
                  placeholder="Kapasitas / Unit (cth. 40)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#2C1EE8] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Orang (Ruang) / Stok (Barang)</p>
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">Kategori</label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="cth. Ruangan, Peralatan, AV"
                  maxLength={100}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#2C1EE8] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {["Ruangan", "Laboratorium", "Peralatan", "Multimedia", "Olahraga"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, category: cat }))}
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition ${
                      form.category === cat
                        ? "bg-blue-100 text-[#2C1EE8] border-blue-300"
                        : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    + {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Guru Pengurus Fasilitas */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Guru Pengurus / Penanggung Jawab
            </label>
            <div className="relative">
              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                name="managerTeacherId"
                value={form.managerTeacherId}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#2C1EE8] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer"
              >
                <option value="">-- Tanpa Guru Pengurus (Hanya Admin) --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName || t.name || t.username} ({t.nip || "NIP -"})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Guru yang dipilih akan memiliki tab khusus untuk menyetujui / menolak peminjaman fasilitas/barang ini.
            </p>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">Deskripsi & Spesifikasi</label>
            <div className="relative">
              <AlignLeft className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Deskripsi singkat spesifikasi, ketersediaan, atau panduan penggunaan..."
                maxLength={1000}
                rows={3}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#2C1EE8] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
              />
            </div>
          </div>

          {/* Upload Gambar Fasilitas */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">Foto / Gambar Fasilitas</label>
            <div className="space-y-3">
              {form.imageUrl && (
                <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                  <img src={resolveImageUrl(form.imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, imageUrl: "" }))}
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-rose-600 transition cursor-pointer"
                    title="Hapus gambar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="facility-image-input"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingImage(true);
                    setError("");
                    try {
                      const { uploadImageToCloudinary } = await import("@/services/cloudinaryService");
                      const { resolveImageUrl } = await import("@/lib/utils");
                      const url = await uploadImageToCloudinary(file);
                      if (url) {
                        setForm((prev) => ({ ...prev, imageUrl: url }));
                      } else {
                        setError("Gagal mengunggah gambar.");
                      }
                    } catch (err) {
                      setError("Error mengunggah gambar fasilitas.");
                    } finally {
                      setUploadingImage(false);
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => document.getElementById("facility-image-input")?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer disabled:opacity-50"
                >
                  {uploadingImage ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#2C1EE8]" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-[#2C1EE8]" />
                  )}
                  <span>{uploadingImage ? "Mengunggah..." : form.imageUrl ? "Ganti Gambar" : "Upload Gambar"}</span>
                </button>
                {form.imageUrl && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Gambar Siap
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pilihan Model 3D dari Storage & Manual URL */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Model 3D Interaktif (.glb / .gltf) <span className="text-slate-400 font-normal lowercase">(opsional)</span>
              </label>
              {form.model3dUrl && (
                <button
                  type="button"
                  onClick={() => setShow3DPreview(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold bg-[#2C1EE8] text-white hover:bg-blue-700 transition cursor-pointer shadow-2xs"
                >
                  <Box className="w-3.5 h-3.5 text-blue-300" />
                  <span>Preview 3D</span>
                </button>
              )}
            </div>

            {/* Dropdown Preset Storage */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Pilih dari 3D Model di Storage Sekolah:
              </label>
              <div className="relative">
                <Box className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={
                    STORAGE_3D_MODELS.find(
                      (m) => m.url === form.model3dUrl || m.localFallback === form.model3dUrl
                    )?.url || (form.model3dUrl ? "custom" : "")
                  }
                  onChange={(e) => {
                    const selectedVal = e.target.value;
                    if (selectedVal === "custom") {
                      // Keep existing URL or leave for manual typing
                    } else {
                      setForm((prev) => ({ ...prev, model3dUrl: selectedVal }));
                    }
                  }}
                  className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-extrabold text-slate-800 focus:border-[#2C1EE8] focus:outline-none transition-all cursor-pointer appearance-none"
                >
                  <option value="">-- Tanpa Model 3D --</option>
                  <optgroup label="Aset 3D Storage (Supabase & Local)">
                    {STORAGE_3D_MODELS.map((m) => (
                      <option key={m.id} value={m.url}>
                        {m.label} ({m.category})
                      </option>
                    ))}
                  </optgroup>
                  <option value="custom">-- Input URL Custom / Link Manual --</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Input Link Manual / Detail URL */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                URL / Path File Model 3D (.glb):
              </label>
              <input
                name="model3dUrl"
                value={form.model3dUrl}
                onChange={handleChange}
                placeholder="cth. /desktop_computer.glb atau https://.../model.glb"
                maxLength={500}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-800 focus:border-[#2C1EE8] focus:outline-none transition-all"
              />
            </div>

            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Model 3D yang dipilih akan muncul sebagai tombol 3D interaktif pada Katalog Fasilitas.
            </p>
          </div>

          {/* Modal Preview 3D */}
          {show3DPreview && form.model3dUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
              <div className="bg-slate-950 w-full max-w-3xl rounded-3xl p-5 border border-slate-800 space-y-4 max-h-[90vh] flex flex-col font-sans">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-white font-extrabold text-sm">
                    <Box className="w-4 h-4 text-blue-400" />
                    <span>Pratinjau Model 3D — {form.name || "Fasilitas"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShow3DPreview(false)}
                    className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <DesktopComputerViewer3D
                    glbPath={form.model3dUrl}
                    title={form.name || "Pratinjau Fasilitas"}
                    subtitle="Model 3D Interaktif Storage"
                    compact={true}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Status Aktif */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-xs font-extrabold text-slate-800">Status Akses Fasilitas</p>
              <p className="text-[11px] text-slate-500 font-medium">
                {form.isActive ? "Aktif — dapat dibooking oleh siswa/organisasi" : "Nonaktif — tidak dapat dibooking"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                form.isActive
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : "bg-slate-200 text-slate-600 border border-slate-300"
              }`}
            >
              {form.isActive ? (
                <ToggleRight className="w-5 h-5" />
              ) : (
                <ToggleLeft className="w-5 h-5" />
              )}
              {form.isActive ? "Aktif" : "Nonaktif"}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-[#2C1EE8] text-white text-sm font-extrabold hover:bg-blue-700 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-blue-500/20"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEdit ? "Simpan Perubahan" : "Tambah Fasilitas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal Konfirmasi Hapus
// ─────────────────────────────────────────────
function DeleteConfirmModal({ facility, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      await facilityService.deleteFacility(facility.id);
      onDeleted();
    } catch (err) {
      setError(err?.message || "Gagal menghapus fasilitas.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[28px] p-6 shadow-2xl space-y-4 border border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Hapus Fasilitas?</h3>
            <p className="text-xs text-slate-500">Tindakan ini tidak bisa dibatalkan.</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
          <p className="text-sm font-extrabold text-slate-900">{facility.name}</p>
          <p className="text-xs text-slate-500 font-medium">{facility.location}</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-rose-600/20"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function AdminFacilityTab({ isQuickView = false, onViewAll }) {
  // Sub-tabs: 'facilities' | 'bookings'
  const [subTab, setSubTab] = useState("facilities");

  // ── Facilities state ──
  const [facilities, setFacilities] = useState([]);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [facilityError, setFacilityError] = useState("");
  const [searchFacility, setSearchFacility] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [deletingFacility, setDeletingFacility] = useState(null);

  // ── Bookings state ──
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [searchBooking, setSearchBooking] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [note, setNote] = useState("");

  // ── Load Facilities ──
  const loadFacilities = useCallback(async () => {
    setLoadingFacilities(true);
    setFacilityError("");
    try {
      const res = await facilityService.getFacilities({ pageSize: 100 });
      const rawItems = res?.data?.items || res?.data || [];
      const normalizedItems = (Array.isArray(rawItems) ? rawItems : []).map((f) => ({
        ...f,
        id: f.id || f.Id,
        name: f.name || f.Name || "",
        description: f.description || f.Description || "",
        location: f.location || f.Location || "",
        capacity: f.capacity ?? f.Capacity ?? 0,
        imageUrl: f.imageUrl || f.ImageUrl || "",
        model3dUrl: f.model3dUrl || f.Model3dUrl || f.model3DUrl || f.Model3DUrl || "",
        category: f.category || f.Category || "",
        isActive: f.isActive ?? f.IsActive ?? true,
      }));
      setFacilities(normalizedItems);
    } catch (err) {
      setFacilityError(err?.message || "Gagal memuat daftar fasilitas.");
    } finally {
      setLoadingFacilities(false);
    }
  }, []);

  // ── Load Bookings ──
  const loadBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const res = await facilityService.getBookings();
      setBookings(Array.isArray(res) ? res : []);
    } catch {
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadFacilities();
    loadBookings();
  }, [loadFacilities, loadBookings]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleToggleActive = async (facility) => {
    try {
      const currentActive = facility.isActive ?? facility.IsActive ?? true;
      const nextActive = !currentActive;
      await facilityService.updateFacility(facility.id || facility.Id, {
        name: facility.name || facility.Name,
        description: facility.description || facility.Description || null,
        location: facility.location || facility.Location,
        capacity: Number(facility.capacity ?? facility.Capacity ?? 1),
        imageUrl: facility.imageUrl || facility.ImageUrl || null,
        model3dUrl: facility.model3dUrl || facility.Model3dUrl || facility.model3DUrl || facility.Model3DUrl || null,
        model3DUrl: facility.model3dUrl || facility.Model3dUrl || facility.model3DUrl || facility.Model3DUrl || null,
        Model3DUrl: facility.model3dUrl || facility.Model3dUrl || facility.model3DUrl || facility.Model3DUrl || null,
        category: facility.category || facility.Category || null,
        isActive: nextActive,
        managerTeacherId: facility.managerTeacherId || facility.ManagerTeacherId || null,
      });
      loadFacilities();
    } catch (err) {
      alert("Gagal mengubah status: " + (err?.message || ""));
    }
  };

  const handleUpdateBookingStatus = (bookingId, newStatus) => {
    facilityService.updateBookingStatus(bookingId, newStatus, note).catch(console.warn);
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
    setSelectedBooking(null);
    setNote("");
  };

  const filteredFacilities = facilities.filter(
    (f) =>
      f.name?.toLowerCase().includes(searchFacility.toLowerCase()) ||
      f.location?.toLowerCase().includes(searchFacility.toLowerCase()) ||
      f.category?.toLowerCase().includes(searchFacility.toLowerCase())
  );

  const filteredBookings = bookings.filter(
    (b) =>
      b.organization?.toLowerCase().includes(searchBooking.toLowerCase()) ||
      b.activityName?.toLowerCase().includes(searchBooking.toLowerCase()) ||
      b.facilityTitle?.toLowerCase().includes(searchBooking.toLowerCase())
  );

  // If in quick view, show max 4 facilities and use a clean double-column/single-column list
  const displayFacilities = isQuickView ? filteredFacilities.slice(0, 4) : filteredFacilities;
  const gridClasses = isQuickView
    ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
    : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";

  return (
    <div className="space-y-6 font-sans">
      {/* ── Header (Hidden in QuickView) ── */}
      {!isQuickView && (
        <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-[#2C1EE8] border border-blue-100">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Manajemen Fasilitas & Sarpras</h2>
              <p className="text-xs text-slate-500 font-medium">Kelola data laboratorium, aula, lapangan, dan persetujuan booking</p>
            </div>
          </div>

          {/* Sub-tab Switcher */}
          <div className="flex bg-slate-100 rounded-xl p-1.5 gap-1.5 border border-slate-200/80 shrink-0">
            <button
              onClick={() => setSubTab("facilities")}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                subTab === "facilities"
                  ? "bg-white text-[#2C1EE8] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Data Fasilitas
            </button>
            <button
              onClick={() => setSubTab("bookings")}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                subTab === "bookings"
                  ? "bg-white text-[#2C1EE8] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Approval Booking
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          SUB-TAB: KELOLA FASILITAS
      ══════════════════════════════════════ */}
      {(subTab === "facilities" || isQuickView) && (
        <div className="space-y-6">
          {/* Toolbar (Hidden in QuickView) */}
          {!isQuickView && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  suppressHydrationWarning={true}
                  type="text"
                  placeholder="Cari fasilitas, lokasi, atau kategori..."
                  value={searchFacility}
                  onChange={(e) => setSearchFacility(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#2C1EE8] focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm font-semibold outline-none transition-all shadow-2xs"
                />
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={loadFacilities}
                  className="p-2.5 rounded-xl border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer shadow-2xs"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingFacilities ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={() => { setEditingFacility(null); setShowFormModal(true); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2C1EE8] text-white text-xs sm:text-sm font-extrabold hover:bg-blue-700 transition cursor-pointer shrink-0 shadow-md shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Fasilitas</span>
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {facilityError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center gap-2 shadow-2xs">
              <XCircle className="w-4 h-4 shrink-0" />
              {facilityError}
            </div>
          )}

          {/* Facilities Grid Wrapper inside card container in QuickView */}
          {isQuickView ? (
            <div className="bg-white rounded-[24px] border border-slate-200/80 p-5 shadow-xs space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-[#2C1EE8]" />
                <span>Katalog Sarana Prasarana ({filteredFacilities.length})</span>
              </h3>

              {loadingFacilities ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : displayFacilities.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-medium">Belum ada data sarpras</div>
              ) : (
                <div className={gridClasses}>
                  {displayFacilities.map((f) => (
                    <div key={f.id} className="border border-slate-200/60 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-[#2C1EE8]/40 transition shadow-2xs">
                      <div className="h-32 bg-slate-900 overflow-hidden relative">
                        {f.imageUrl ? (
                          <img
                            src={resolveImageUrl(f.imageUrl)}
                            alt={f.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-50 text-[#2C1EE8]">
                            <Building2 className="w-8 h-8 opacity-45" />
                          </div>
                        )}
                        <span className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${f.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-150 text-slate-600 border border-slate-200"}`}>
                          {f.isActive ? "Aktif" : "Mati"}
                        </span>
                      </div>
                      <div className="p-3.5 space-y-1.5">
                        <h4 className="font-extrabold text-slate-900 text-xs truncate">{f.name}</h4>
                        <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{f.location}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {onViewAll && filteredFacilities.length > 4 && (
                <div className="pt-2 border-t border-slate-100 flex justify-center">
                  <button
                    onClick={onViewAll}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#2C1EE8] hover:text-blue-700 hover:underline transition"
                  >
                    <span>Kelola Semua Sarpras ({filteredFacilities.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Full Catalog Screen Layout */
            loadingFacilities ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 rounded-[24px] bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : filteredFacilities.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center bg-white rounded-[28px] border border-slate-200/80 shadow-xs">
                <Package className="w-12 h-12 text-slate-300 mb-3" />
                <p className="font-extrabold text-slate-600 text-base">
                  {searchFacility ? "Fasilitas tidak ditemukan" : "Belum ada fasilitas"}
                </p>
              </div>
            ) : (
              <div className={gridClasses}>
                {filteredFacilities.map((f) => (
                  <div
                    key={f.id}
                    className="bg-white rounded-[24px] border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-[#2C1EE8]/40 transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                  >
                    <div>
                      {f.imageUrl ? (
                        <div className="h-48 sm:h-52 overflow-hidden relative border-b border-slate-100 bg-slate-900">
                          <img
                            src={resolveImageUrl(f.imageUrl)}
                            alt={f.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        </div>
                      ) : (
                        <div className="h-48 sm:h-52 bg-gradient-to-br from-[#2C1EE8]/10 via-blue-50 to-indigo-100 flex items-center justify-center border-b border-slate-100">
                          <Building2 className="w-14 h-14 text-[#2C1EE8]/30" />
                        </div>
                      )}

                      <div className="p-5 sm:p-6 space-y-3.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <h4 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-[#2C1EE8] transition-colors truncate">
                              {f.name}
                            </h4>
                            <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{f.location}</span>
                            </p>
                          </div>
                          <span
                            className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-extrabold border ${
                              f.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                          >
                            {f.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>

                        {/* Badges Info */}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            {f.capacity} orang
                          </span>
                          {f.category && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold bg-blue-50 text-[#2C1EE8] border border-blue-100">
                              <Tag className="w-3.5 h-3.5 text-[#2C1EE8]" />
                              {f.category}
                            </span>
                          )}
                        </div>

                        {f.description && (
                          <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50/80 p-3 rounded-xl border border-slate-100 line-clamp-2">
                            {f.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="p-5 sm:p-6 pt-0">
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleToggleActive(f)}
                          title={f.isActive ? "Nonaktifkan Akses" : "Aktifkan Akses"}
                          className={`p-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            f.isActive
                              ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          {f.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => { setEditingFacility(f); setShowFormModal(true); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold bg-blue-50 text-[#2C1EE8] border border-blue-200/80 hover:bg-[#2C1EE8] hover:text-white transition-all cursor-pointer shadow-2xs"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => setDeletingFacility(f)}
                          className="p-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                          title="Hapus Fasilitas"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          SUB-TAB: APPROVAL BOOKING (Only full screen view)
      ══════════════════════════════════════ */}
      {subTab === "bookings" && !isQuickView && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                suppressHydrationWarning={true}
                type="text"
                placeholder="Cari booking, tempat, atau organisasi..."
                value={searchBooking}
                onChange={(e) => setSearchBooking(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#2C1EE8] text-xs sm:text-sm font-semibold outline-none transition-all shadow-2xs"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#2C1EE8] bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100">
              <ShieldCheck className="w-4 h-4" />
              <span>Persetujuan Final Admin</span>
            </div>
          </div>

          {/* Bookings List */}
          <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-[#2C1EE8]" />
                <span>Permohonan Peminjaman ({filteredBookings.length})</span>
              </h3>
              <button
                onClick={loadBookings}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loadingBookings ? "animate-spin" : ""}`} />
              </button>
            </div>

            {loadingBookings ? (
              <div className="p-8 text-center text-slate-400 animate-pulse text-xs font-medium">Memuat data booking...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                <Package className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm font-extrabold text-slate-600">Tidak ada permohonan booking</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredBookings.map((b) => (
                  <div key={b.id} className="p-5 hover:bg-slate-50/80 transition-colors space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-[#2C1EE8] border border-blue-200">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {b.status}
                        </span>
                        <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200/80">
                          {b.organization}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-semibold">Tanggal: {b.date}</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-base font-extrabold text-slate-900">&quot;{b.activityName}&quot;</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <span className="font-extrabold text-[#2C1EE8]">{b.facilityTitle}</span>
                          <span>•</span>
                          <span className="bg-blue-50 text-[#2C1EE8] px-2.5 py-0.5 rounded-lg font-bold">
                            Jam: {b.slotFormatted}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="self-start md:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-[#2C1EE8] text-white hover:bg-blue-700 transition-all cursor-pointer shadow-md shadow-blue-500/20 active:scale-95"
                      >
                        <Eye className="w-4 h-4" />
                        Detail & Verifikasi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showFormModal && (
        <FacilityFormModal
          facility={editingFacility}
          onClose={() => { setShowFormModal(false); setEditingFacility(null); }}
          onSaved={() => { setShowFormModal(false); setEditingFacility(null); loadFacilities(); }}
        />
      )}

      {deletingFacility && (
        <DeleteConfirmModal
          facility={deletingFacility}
          onClose={() => setDeletingFacility(null)}
          onDeleted={() => { setDeletingFacility(null); loadFacilities(); }}
        />
      )}

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-[28px] p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900">Persetujuan Final Sarpras Admin</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div>
                  <span className="text-xs text-slate-400 block font-bold">Organisasi:</span>
                  <span className="font-extrabold text-slate-900">{selectedBooking.organization}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-bold">Nama Kegiatan:</span>
                  <span className="font-extrabold text-[#2C1EE8]">{selectedBooking.activityName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-bold">Fasilitas & Jam:</span>
                  <span className="font-bold text-gray-800">
                    {selectedBooking.facilityTitle} ({selectedBooking.slotFormatted})
                  </span>
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">Deskripsi Kegiatan:</span>
                <p className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs leading-relaxed font-medium">
                  {selectedBooking.description}
                </p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">Catatan Admin (Opsional):</span>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tambahkan catatan..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-none focus:border-[#2C1EE8] transition"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => handleUpdateBookingStatus(selectedBooking.id, "Ditolak Admin")}
                className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                Tolak Peminjaman
              </button>
              <button
                onClick={() => handleUpdateBookingStatus(selectedBooking.id, "Disetujui Admin")}
                className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-[#2C1EE8] text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                ACC Final (Disetujui Admin)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
