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

  const isUserSelected = (userId) => {
    return selectedUsers.some((u) => (u.userId || u.id) === userId);
  };

  const toggleUser = (user) => {
    const uid = user.userId || user.id;
    if (isUserSelected(uid)) {
      setSelectedUsers((prev) => prev.filter((u) => (u.userId || u.id) !== uid));
    } else {
      setSelectedUsers((prev) => [
        ...prev,
        {
          userId: uid,
          fullName: user.fullName || user.userName,
          userName: user.userName,
          role: user.role,
          className: user.className || selectedClass,
          position: user.position || selectedPosition,
          photoUrl: user.photoUrl || user.avatarUrl
        }
      ]);
    }
  };

  const toggleSelectAllCurrent = () => {
    const currentIds = userList.map((u) => u.userId || u.id);
    const allSelected = currentIds.every((id) => isUserSelected(id));

    if (allSelected) {
      setSelectedUsers((prev) => prev.filter((u) => !currentIds.includes(u.userId || u.id)));
    } else {
      const usersToAdd = userList
        .filter((u) => !isUserSelected(u.userId || u.id))
        .map((u) => ({
          userId: u.userId || u.id,
          fullName: u.fullName || u.userName,
          userName: u.userName,
          role: u.role,
          className: u.className || selectedClass,
          position: u.position || selectedPosition,
          photoUrl: u.photoUrl || u.avatarUrl
        }));
      setSelectedUsers((prev) => [...prev, ...usersToAdd]);
    }
  };

  const handleSave = () => {
    if (onSave) onSave(selectedUsers);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-none border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] text-left">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 uppercase">
              <Users className="w-4 h-4 text-[#2C1EE8]" />
              Pilih Anggota Komunitas
            </h3>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Pilih anggota per kelas atau mata pelajaran untuk dimasukkan ke grup secara massal.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector & Class/Position Pills */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("Student")}
              className={`px-4 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                activeTab === "Student"
                  ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                  : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
              }`}
            >
              Siswa Berdasarkan Kelas
            </button>
            <button
              onClick={() => setActiveTab("Teacher")}
              className={`px-4 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                activeTab === "Teacher"
                  ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                  : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
              }`}
            >
              Guru & Staf Pengajar
            </button>
          </div>

          {/* Sub Filters */}
          {activeTab === "Student" ? (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {OFFICIAL_PPLG_CLASSES.map((cls) => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-3 py-1 rounded-none text-xs font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer border ${
                    selectedClass === cls
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {TEACHER_POSITIONS.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setSelectedPosition(pos)}
                  className={`px-3 py-1 rounded-none text-xs font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer border ${
                    selectedPosition === pos
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama pengguna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-none pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2C1EE8]"
            />
          </div>
        </div>

        {/* User List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 text-xs text-slate-600">
            <button
              onClick={toggleSelectAllCurrent}
              className="font-bold text-[#2C1EE8] hover:underline flex items-center gap-1.5 cursor-pointer uppercase tracking-wider text-[11px]"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Pilih Semua di Daftar Ini</span>
            </button>
            <span className="font-mono text-slate-400 text-[11px]">
              Ditemukan: {userList.length} orang
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
              Memuat data pengguna...
            </div>
          ) : userList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Tidak ada pengguna yang ditemukan pada filter ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {userList.map((u) => {
                const uid = u.userId || u.id;
                const isSelected = isUserSelected(uid);
                return (
                  <div
                    key={uid}
                    onClick={() => toggleUser(u)}
                    className={`p-2.5 rounded-none border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-blue-50/80 border-[#2C1EE8]"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-900 truncate uppercase">{u.fullName || u.userName}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        {u.className || u.position || u.role}
                      </p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-none border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-[#2C1EE8] border-[#2C1EE8] text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Terpilih: <strong className="text-[#2C1EE8] font-mono">{selectedUsers.length}</strong> Orang
          </span>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white text-xs font-bold uppercase tracking-wider rounded-none shadow-xs cursor-pointer"
            >
              Simpan Pilihan ({selectedUsers.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
