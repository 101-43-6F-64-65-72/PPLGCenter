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
} from "lucide-react";
import facilityService from "@/services/facilityService";
import userService from "@/services/userService";
import apiClient from "@/lib/api";
import { resolveImageUrl } from "@/lib/utils";

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
    category: facility?.category || facility?.Category || "",
    isActive: facility?.isActive ?? facility?.IsActive ?? true,
    managerTeacherId: facility?.managerTeacherId || facility?.ManagerTeacherId || "",
  });
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-lg border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white rounded-t-lg z-10">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#2c1ee8]" />
            <h3 className="text-base font-bold text-slate-900">
              {isEdit ? "Edit Fasilitas" : "Tambah Fasilitas Baru"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-md transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Nama */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Nama Fasilitas <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="cth. Aula Utama SMKN 2 Surakarta"
                maxLength={100}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2c1ee8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all"
              />
            </div>
          </div>

          {/* Lokasi */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Lokasi <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="cth. Lantai 1, Gedung Utama"
                maxLength={200}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2c1ee8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all"
              />
            </div>
          </div>

          {/* Kapasitas & Kategori */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Kapasitas <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  name="capacity"
                  type="number"
                  min="1"
                  max="10000"
                  value={form.capacity}
                  onChange={handleChange}
                  placeholder="200"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2c1ee8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Kategori</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="cth. Ruangan, Lapangan"
                  maxLength={100}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2c1ee8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Guru Pengurus Fasilitas */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Guru Pengurus / Penanggung Jawab
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                name="managerTeacherId"
                value={form.managerTeacherId}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2c1ee8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all appearance-none cursor-pointer"
              >
                <option value="">-- Tanpa Guru Pengurus (Hanya Admin) --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName || t.name || t.username} ({t.nip || "NIP -"})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Guru yang dipilih akan memiliki tab khusus untuk menyetujui / menolak peminjaman fasilitas ini.
            </p>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Deskripsi</label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Deskripsi singkat tentang fasilitas ini..."
                maxLength={1000}
                rows={3}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2c1ee8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all resize-none"
              />
            </div>
          </div>

          {/* Upload Gambar Fasilitas */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Foto / Gambar Fasilitas</label>
            <div className="space-y-3">
              {form.imageUrl && (
                <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={resolveImageUrl(form.imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, imageUrl: "" }))}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-rose-600 transition cursor-pointer"
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
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-700 transition cursor-pointer disabled:opacity-50"
                >
                  {uploadingImage ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#2c1ee8]" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-[#2c1ee8]" />
                  )}
                  <span>{uploadingImage ? "Mengunggah..." : form.imageUrl ? "Ganti Gambar" : "Upload Gambar"}</span>
                </button>
                {form.imageUrl && (
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Gambar siap
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status Aktif */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200">
            <div>
              <p className="text-sm font-bold text-gray-800">Status Fasilitas</p>
              <p className="text-xs text-gray-500">
                {form.isActive ? "Aktif — dapat dibooking" : "Nonaktif — tidak bisa dibooking"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                form.isActive
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : "bg-gray-200 text-gray-500 border border-gray-300"
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
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-2xl bg-[#2c1ee8] text-white text-sm font-bold hover:bg-[#2218a3] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h3 className="font-black text-gray-900">Hapus Fasilitas?</h3>
            <p className="text-xs text-gray-500">Tindakan ini tidak bisa dibatalkan.</p>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200">
          <p className="text-sm font-bold text-gray-800">{facility.name}</p>
          <p className="text-xs text-gray-500">{facility.location}</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
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
export default function AdminFacilityTab() {
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

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#2c1ee8]" />
          <h2 className="text-base font-bold text-slate-900">Manajemen Fasilitas & Sarpras</h2>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex bg-slate-100 rounded-md p-1 gap-1 border border-slate-200">
          <button
            onClick={() => setSubTab("facilities")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              subTab === "facilities"
                ? "bg-white text-[#2c1ee8] shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Fasilitas
          </button>
          <button
            onClick={() => setSubTab("bookings")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              subTab === "bookings"
                ? "bg-white text-[#2c1ee8] shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Approval Booking
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════
          SUB-TAB: KELOLA FASILITAS
      ══════════════════════════════════════ */}
      {subTab === "facilities" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                suppressHydrationWarning={true}
                type="text"
                placeholder="Cari fasilitas, lokasi, atau kategori..."
                value={searchFacility}
                onChange={(e) => setSearchFacility(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#2c1ee8] text-xs transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadFacilities}
                className="p-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loadingFacilities ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => { setEditingFacility(null); setShowFormModal(true); }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#2c1ee8] text-white text-xs font-bold hover:bg-[#2218a3] transition cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Fasilitas</span>
              </button>
            </div>
          </div>

          {/* Error */}
          {facilityError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              {facilityError}
            </div>
          )}

          {/* Facilities Grid */}
          {loadingFacilities ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-3xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : filteredFacilities.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-100">
              <Package className="w-12 h-12 text-gray-300 mb-3" />
              <p className="font-bold text-gray-500 text-sm">
                {searchFacility ? "Fasilitas tidak ditemukan" : "Belum ada fasilitas"}
              </p>
              {!searchFacility && (
                <button
                  onClick={() => { setEditingFacility(null); setShowFormModal(true); }}
                  className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#2c1ee8] text-white text-xs font-bold hover:bg-[#2218a3] transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Fasilitas Pertama
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredFacilities.map((f) => (
                <div
                  key={f.id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all overflow-hidden group"
                >
                  {/* Image or placeholder */}
                  {f.imageUrl ? (
                    <div className="h-36 overflow-hidden">
                      <img
                        src={resolveImageUrl(f.imageUrl)}
                        alt={f.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    </div>
                  ) : (
                    <div className="h-36 bg-gradient-to-br from-[#2c1ee8]/10 to-blue-100 flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-[#2c1ee8]/30" />
                    </div>
                  )}

                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-black text-gray-900 text-sm leading-tight">{f.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {f.location}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          f.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        }`}
                      >
                        {f.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {f.capacity} orang
                      </span>
                      {f.category && (
                        <span className="flex items-center gap-1 bg-blue-50 text-[#2c1ee8] px-2 py-0.5 rounded-lg font-semibold">
                          <Tag className="w-3 h-3" />
                          {f.category}
                        </span>
                      )}
                    </div>

                    {f.description && (
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{f.description}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                      <button
                        onClick={() => handleToggleActive(f)}
                        title={f.isActive ? "Nonaktifkan" : "Aktifkan"}
                        className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          f.isActive
                            ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        }`}
                      >
                        {f.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setEditingFacility(f); setShowFormModal(true); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-blue-50 text-[#2c1ee8] hover:bg-blue-100 transition cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingFacility(f)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          SUB-TAB: APPROVAL BOOKING
      ══════════════════════════════════════ */}
      {subTab === "bookings" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                suppressHydrationWarning={true}
                type="text"
                placeholder="Cari booking, tempat, atau organisasi..."
                value={searchBooking}
                onChange={(e) => setSearchBooking(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#2c1ee8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#2c1ee8] bg-blue-50 px-4 py-2.5 rounded-2xl border border-blue-100">
              <ShieldCheck className="w-4 h-4" />
              <span>Persetujuan Final Admin</span>
            </div>
          </div>

          {/* Bookings List */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#2c1ee8]" />
                <span>Permohonan Peminjaman ({filteredBookings.length})</span>
              </h3>
              <button
                onClick={loadBookings}
                className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingBookings ? "animate-spin" : ""}`} />
              </button>
            </div>

            {loadingBookings ? (
              <div className="p-8 text-center text-gray-400 animate-pulse text-sm">Memuat data booking...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-gray-400">
                <Package className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm font-bold text-gray-500">Tidak ada permohonan booking</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredBookings.map((b) => (
                  <div key={b.id} className="p-5 hover:bg-gray-50/80 transition-colors space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2c1ee8] border border-blue-200">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {b.status}
                        </span>
                        <span className="text-xs font-extrabold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-lg">
                          {b.organization}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">Tanggal: {b.date}</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-base font-extrabold text-gray-900">&quot;{b.activityName}&quot;</h4>
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span className="font-bold text-[#2c1ee8]">{b.facilityTitle}</span>
                          <span>•</span>
                          <span className="bg-blue-50 text-[#2c1ee8] px-2 py-0.5 rounded font-semibold">
                            Jam: {b.slotFormatted}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="self-start md:self-center inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#2c1ee8] text-white hover:bg-[#2218a3] transition-all cursor-pointer shadow-sm active:scale-95"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900">Persetujuan Final Sarpras Admin</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
                <div>
                  <span className="text-xs text-gray-400 block font-bold">Organisasi:</span>
                  <span className="font-extrabold text-gray-900">{selectedBooking.organization}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-bold">Nama Kegiatan:</span>
                  <span className="font-extrabold text-[#2c1ee8]">{selectedBooking.activityName}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-bold">Fasilitas & Jam:</span>
                  <span className="font-bold text-gray-800">
                    {selectedBooking.facilityTitle} ({selectedBooking.slotFormatted})
                  </span>
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-gray-400 block mb-1">Deskripsi Kegiatan:</span>
                <p className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs leading-relaxed">
                  {selectedBooking.description}
                </p>
              </div>
              <div>
                <span className="text-xs font-bold text-gray-400 block mb-1">Catatan Admin (Opsional):</span>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tambahkan catatan..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs focus:outline-none focus:border-[#2c1ee8] transition"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => handleUpdateBookingStatus(selectedBooking.id, "Ditolak Admin")}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                Tolak Peminjaman
              </button>
              <button
                onClick={() => handleUpdateBookingStatus(selectedBooking.id, "Disetujui Admin")}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#2c1ee8] text-white hover:bg-[#2218a3] transition-all shadow-md cursor-pointer flex items-center gap-1.5"
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
