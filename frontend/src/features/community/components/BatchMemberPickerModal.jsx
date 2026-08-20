"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Search, Check, Users, GraduationCap, BookOpen, CheckSquare, Square } from "lucide-react";
import userService from "@/services/userService";
import schoolClassService from "@/services/schoolClassService";

const OFFICIAL_PPLG_CLASSES = [
  "X PPLG A",
  "X PPLG B",
  "XI PPLG A",
  "XI PPLG B",
  "XII PPLG A",
  "XII PPLG B"
];

const TEACHER_POSITIONS = [
  "Semua Guru",
  "Pengembangan Perangkat Lunak Dan Gim",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "Matematika",
  "Informatika",
  "Pendidikan Agama",
  "Pendidikan Pancasila"
];

export default function BatchMemberPickerModal({ isOpen, onClose, onSave, initialSelected = [] }) {
  const [activeTab, setActiveTab] = useState("Student"); // "Student" | "Teacher"
  const [selectedClass, setSelectedClass] = useState("X PPLG A");
  const [selectedPosition, setSelectedPosition] = useState("Semua Guru");
  const [searchQuery, setSearchQuery] = useState("");

  const [classList, setClassList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Store selected user objects: { userId, fullName, role, className, position, photoUrl }
  const [selectedUsers, setSelectedUsers] = useState(initialSelected);

  useEffect(() => {
    setSelectedUsers(initialSelected);
  }, [initialSelected, isOpen]);

  // Load Classes from API to get classId mappings
  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await schoolClassService.getClasses();
        const items = res?.data || res?.items || res || [];
        if (Array.isArray(items)) setClassList(items);
      } catch (err) {
        console.error("Failed to load classes:", err);
      }
    }
    if (isOpen) loadClasses();
  }, [isOpen]);

  // Fetch Users based on Active Tab & Filters
  const loadUsers = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    try {
      if (activeTab === "Student") {
        // Find matching class ID
        const targetClassObj = classList.find((c) => c.name === selectedClass);
        const params = {
          role: "Student",
          pageSize: 100,
          classId: targetClassObj?.id || undefined,
          search: searchQuery.trim() || undefined
        };
        const res = await userService.getUsers(params);
        const items = res?.data?.items || res?.items || res?.data || [];
        setUserList(Array.isArray(items) ? items : []);
      } else {
        // Teacher tab
        const params = {
          role: "Teacher",
          pageSize: 100,
          search: searchQuery.trim() || undefined
        };
        const res = await userService.getUsers(params);
        let items = res?.data?.items || res?.items || res?.data || [];
        if (Array.isArray(items)) {
          if (selectedPosition !== "Semua Guru") {
            items = items.filter((t) => t.position?.toLowerCase().includes(selectedPosition.toLowerCase()));
          }
          setUserList(items);
        }
      }
    } catch (err) {
      console.error("Failed to load users for picker:", err);
      setUserList([]);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, activeTab, selectedClass, selectedPosition, searchQuery, classList]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const isUserSelected = (userId) => selectedUsers.some((u) => u.userId === userId || u.id === userId);

  const toggleUser = (user) => {
    const userId = user.id || user.userId;
    if (isUserSelected(userId)) {
      setSelectedUsers(selectedUsers.filter((u) => (u.id || u.userId) !== userId));
    } else {
      setSelectedUsers([
        ...selectedUsers,
        {
          userId: userId,
          id: userId,
          fullName: user.fullName || user.userName,
          role: user.role,
          className: user.className || user.class?.name,
          position: user.position,
          photoUrl: user.photoUrl
        }
      ]);
    }
  };

  // Select All / Deselect All for current list
  const currentListUserIds = userList.map((u) => u.id);
  const isAllCurrentSelected = currentListUserIds.length > 0 && currentListUserIds.every((id) => isUserSelected(id));

  const handleToggleSelectAll = () => {
    if (isAllCurrentSelected) {
      // Unselect all in current list
      setSelectedUsers(selectedUsers.filter((u) => !currentListUserIds.includes(u.id || u.userId)));
    } else {
      // Select all in current list
      const newItems = userList.map((u) => ({
        userId: u.id,
        id: u.id,
        fullName: u.fullName,
        role: u.role,
        className: u.className || u.class?.name,
        position: u.position,
        photoUrl: u.photoUrl
      }));
      // Merge unique by ID
      const merged = [...selectedUsers];
      newItems.forEach((item) => {
        if (!merged.some((m) => (m.id || m.userId) === item.id)) {
          merged.push(item);
        }
      });
      setSelectedUsers(merged);
    }
  };

  const handleSave = () => {
    onSave(selectedUsers);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[28px] border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col justify-between">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#2C1EE8]" />
              Pilih Anggota Komunitas
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Pilih anggota siswa per kelas atau guru per mata pelajaran secara otomatis.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* Category Tabs: Siswa vs Guru */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 gap-1">
            <button
              onClick={() => setActiveTab("Student")}
              className={`py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "Student" ? "bg-[#2C1EE8] text-white shadow-xs" : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Siswa per Kelas</span>
            </button>

            <button
              onClick={() => setActiveTab("Teacher")}
              className={`py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "Teacher" ? "bg-[#2C1EE8] text-white shadow-xs" : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Guru per Mapel / Posisi</span>
            </button>
          </div>

          {/* Sub Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Filter Selector */}
            {activeTab === "Student" ? (
              <div className="w-full sm:w-auto flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {OFFICIAL_PPLG_CLASSES.map((cls) => (
                  <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                      selectedClass === cls ? "bg-slate-900 text-white shadow-2xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            ) : (
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#2C1EE8]"
              >
                {TEACHER_POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            )}

            {/* Search Bar */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#2C1EE8]"
              />
            </div>
          </div>

          {/* Select All Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={handleToggleSelectAll}
              disabled={userList.length === 0}
              className="inline-flex items-center gap-2 text-xs font-extrabold text-[#2C1EE8] hover:text-blue-700 cursor-pointer disabled:opacity-50"
            >
              {isAllCurrentSelected ? (
                <CheckSquare className="w-4 h-4 text-[#2C1EE8]" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {isAllCurrentSelected
                  ? "Batalkan Pilih Semua"
                  : `Pilih Semua (${userList.length} ${activeTab === "Student" ? "Siswa" : "Guru"})`}
              </span>
            </button>

            <span className="text-xs font-bold text-slate-500">
              Total Dipilih: <span className="text-[#2C1EE8]">{selectedUsers.length}</span> orang
            </span>
          </div>

          {/* User List with Checkboxes */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400 font-bold">Memuat daftar anggota...</div>
            ) : userList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-bold">Tidak ada pengguna ditemukan.</div>
            ) : (
              userList.map((user) => {
                const selected = isUserSelected(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleUser(user)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                      selected ? "bg-blue-50/80 border-blue-200 shadow-2xs" : "bg-white border-slate-200/80 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {user.fullName?.charAt(0) || "U"}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 leading-snug">{user.fullName}</h4>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {user.role === "Student" ? `Kelas: ${user.className || user.class?.name || "-"}` : `Mapel/Posisi: ${user.position || "Guru"}`}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                        selected ? "bg-[#2C1EE8] border-[#2C1EE8] text-white" : "border-slate-300 bg-white"
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-[#2C1EE8] hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            Simpan Anggota ({selectedUsers.length})
          </button>
        </div>
      </div>
    </div>
  );
}
