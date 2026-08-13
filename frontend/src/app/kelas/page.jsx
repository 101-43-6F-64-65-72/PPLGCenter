"use client";

import React, { useState, useEffect, useCallback } from "react";
import classTreeService from "@/services/classTreeService";
import schoolClassService from "@/services/schoolClassService";
import useAuth from "@/hooks/useAuth";
import { hasRole } from "@/lib/permissions";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function DivisionNode({ node, onEdit, onDelete, canEdit }) {
  return (
    <div className="ml-4 border-l-2 border-indigo-500/30 pl-4 my-2">
      <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-xl flex items-center justify-between">
        <div>
          <h4 className="font-bold text-white text-sm">{node.name}</h4>
          {node.description && <p className="text-xs text-slate-400 mt-0.5">{node.description}</p>}
          {node.leaderStudentName && (
            <span className="inline-block mt-1 text-[11px] text-indigo-400 font-medium">
              Ketua Divisi: {node.leaderStudentName}
            </span>
          )}
        </div>

        {canEdit && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(node)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-700 rounded-lg"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(node.id)}
              className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 bg-rose-500/10 rounded-lg border border-rose-500/20"
            >
              Hapus
            </button>
          </div>
        )}
      </div>

      {node.subDivisions && node.subDivisions.length > 0 && (
        <div className="space-y-1">
          {node.subDivisions.map((sub) => (
            <DivisionNode
              key={sub.id}
              node={sub}
              onEdit={onEdit}
              onDelete={onDelete}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function KelasPage() {
  const { isAuthenticated, user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [tree, setTree] = useState([]);
  const [activeLeadership, setActiveLeadership] = useState(null);
  const [rotationConfig, setRotationConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const isManagementAuthorized = hasRole(user?.role, ["Admin", "Teacher"]) || user?.id === activeLeadership?.classLeaderStudentId;

  const fetchClasses = async () => {
    try {
      const res = await schoolClassService.getClasses();
      const items = res?.items || res?.data?.items || res || [];
      setClasses(items);
      if (items.length > 0 && !selectedClassId) {
        setSelectedClassId(items[0].id);
      }
    } catch (err) {
      console.error("Failed to load school classes:", err);
    }
  };

  const loadClassDetails = useCallback(async (classId) => {
    if (!classId) return;
    try {
      setLoading(true);
      const [treeRes, leadRes, rotRes] = await Promise.allSettled([
        classTreeService.getDivisionTree(classId),
        classTreeService.getActiveLeadership(classId),
        classTreeService.getRotationConfig(classId),
      ]);

      if (treeRes.status === "fulfilled") setTree(treeRes.value || []);
      if (leadRes.status === "fulfilled") setActiveLeadership(leadRes.value || null);
      if (rotRes.status === "fulfilled") setRotationConfig(rotRes.value || null);
    } catch (err) {
      console.error("Failed to load class details:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadClassDetails(selectedClassId);
    }
  }, [selectedClassId, loadClassDetails]);

  const handleDeleteDivision = async (divisionId) => {
    if (!confirm("Apakah Anda yakin ingin menghapus divisi ini?")) return;
    try {
      await classTreeService.deleteDivision(divisionId);
      loadClassDetails(selectedClassId);
    } catch (err) {
      alert(err?.message || "Gagal menghapus divisi.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-full mb-2">
              Struktur Kelas & Rotasi PPLG
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Hierarki Divisi Kelas & Rotasi
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Visualisasi struktur pengurus, divisi kelompok kerja, dan sistem rotasi jadwal Kejuruan (KK) / MPU.
            </p>
          </div>

          {/* Class Select Dropdown */}
          <div className="w-full sm:w-64">
            <label className="block text-xs text-slate-400 mb-1 font-medium">Pilih Kelas:</label>
            <select
              id="class-tree-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Active Leadership & Schedule Rotation */}
          <div className="space-y-6 lg:col-span-1">
            {/* Leadership Card */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
              <h3 className="font-bold text-white text-base mb-3 flex items-center gap-2">
                <span>👑</span> Pengurus Kelas Aktif
              </h3>
              {activeLeadership ? (
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[11px] block">Ketua Kelas</span>
                    <span className="font-bold text-indigo-400">
                      {activeLeadership.classLeaderStudentName || activeLeadership.classLeaderStudentId}
                    </span>
                  </div>
                  {activeLeadership.viceLeaderStudentName && (
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                      <span className="text-slate-500 text-[11px] block">Wakil Ketua Kelas</span>
                      <span className="font-bold text-slate-200">
                        {activeLeadership.viceLeaderStudentName}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 text-xs py-4 text-center">
                  Belum ada pengurus kelas yang ditetapkan.
                </p>
              )}
            </div>

            {/* Schedule Rotation Card */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
              <h3 className="font-bold text-white text-base mb-3 flex items-center gap-2">
                <span>🔄</span> Rotasi Jadwal Pelajaran
              </h3>
              {rotationConfig ? (
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <span className="text-slate-400 text-[11px] block">Kategori Minggu Ini</span>
                    <span className="text-lg font-extrabold text-indigo-400">
                      {rotationConfig.currentCategory || "KK"}
                    </span>
                  </div>
                  <div className="text-slate-400 text-xs space-y-1">
                    <p>Anchor Date: {new Date(rotationConfig.anchorStartDate).toLocaleDateString()}</p>
                    <p>Siklus Rotasi: Setiap {rotationConfig.cycleWeeks || 2} Minggu</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-xs py-4 text-center">
                  Konfigurasi rotasi jadwal belum diatur untuk kelas ini.
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Division Hierarchy Tree */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-lg">Struktur Tree Divisi Kelas</h3>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500 text-xs">Memuat struktur divisi...</div>
            ) : tree.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-700 rounded-xl">
                Belum ada divisi yang dibuat untuk kelas ini.
              </div>
            ) : (
              <div className="space-y-2">
                {tree.map((node) => (
                  <DivisionNode
                    key={node.id}
                    node={node}
                    onEdit={() => {}}
                    onDelete={handleDeleteDivision}
                    canEdit={isManagementAuthorized}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
