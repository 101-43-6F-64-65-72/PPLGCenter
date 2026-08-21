"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Search, Check, Users, GraduationCap, CheckSquare, Square, UserPlus } from "lucide-react";
import userService from "@/services/userService";
import schoolClassService from "@/services/schoolClassService";

export const OFFICIAL_PPLG_CLASSES = [
  "X PPLG A",
  "X PPLG B",
  "XI PPLG A",
  "XI PPLG B",
  "XII PPLG A",
  "XII PPLG B"
];

export default function StudentBatchPickerModal({
  isOpen,
  onClose,
  onSave,
  initialSelected = [],
  title = "Pilih Teman / Anggota Peminjam",
  subtitle = "Pilih siswa per kelas (X, XI, XII PPLG A & B) yang ikut meminjam fasilitas."
}) {
  const [selectedClass, setSelectedClass] = useState("X PPLG A");
  const [searchQuery, setSearchQuery] = useState("");
  const [classList, setClassList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Store selected user objects: { userId, id, fullName, role, className, nis }
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

  // Fetch Students based on Class & Search
  const loadUsers = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    try {
      const targetClassObj = classList.find((c) => c.name === selectedClass);
      const params = {
        role: "Student",
        pageSize: 100,
        classId: targetClassObj?.id || undefined,
        search: searchQuery.trim() || undefined,
      };
      const res = await userService.getUsers(params);
      const items = res?.data?.items || res?.items || res?.data || [];
      setUserList(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Failed to load students for picker:", err);
      setUserList([]);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, selectedClass, searchQuery, classList]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const isUserSelected = (userId) =>
    selectedUsers.some((u) => u.userId === userId || u.id === userId);

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
          fullName: user.fullName || user.userName || user.name,
          role: user.role || "Student",
          className: user.className || user.class?.name || selectedClass,
          nis: user.nis || user.NIS || "",
        },
      ]);
    }
  };

  // Select All / Deselect All for current class list
  const currentListUserIds = userList.map((u) => u.id);
  const isAllCurrentSelected =
    currentListUserIds.length > 0 &&
    currentListUserIds.every((id) => isUserSelected(id));

  const handleToggleSelectAll = () => {
    if (isAllCurrentSelected) {
      // Unselect all in current class list
      setSelectedUsers(
        selectedUsers.filter((u) => !currentListUserIds.includes(u.id || u.userId))
      );
    } else {
      // Select all in current class list
      const newItems = userList.map((u) => ({
        userId: u.id,
        id: u.id,
        fullName: u.fullName || u.userName || u.name,
        role: u.role || "Student",
        className: u.className || u.class?.name || selectedClass,
        nis: u.nis || u.NIS || "",
      }));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col justify-between text-slate-900">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#2C1EE8]" />
              {title}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {subtitle}
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
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {/* Class Filter Bar (6 Official PPLG Classes) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Pilih Kelas:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {OFFICIAL_PPLG_CLASSES.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setSelectedClass(cls)}
                  className={`py-2 px-2 rounded-xl text-xs font-black transition-all text-center cursor-pointer border ${
                    selectedClass === cls
                      ? "bg-[#2C1EE8] text-white border-[#2C1EE8] shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Select All Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Cari nama siswa di ${selectedClass}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-[#2C1EE8] focus:bg-white transition-all font-medium"
              />
            </div>

            <button
              type="button"
              onClick={handleToggleSelectAll}
              disabled={isLoading || userList.length === 0}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                isAllCurrentSelected
                  ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                  : "bg-blue-50 text-[#2C1EE8] border-blue-200 hover:bg-blue-100"
              } disabled:opacity-50`}
            >
              {isAllCurrentSelected ? (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Batal Pilih Semua ({selectedClass})</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Pilih Semua ({selectedClass})</span>
                </>
              )}
            </button>
          </div>

          {/* Students Grid List */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
              <span>Daftar Siswa ({userList.length})</span>
              <span className="text-[#2C1EE8]">
                {selectedUsers.length} Siswa Terpilih
              </span>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">
                <div className="w-6 h-6 border-2 border-[#2C1EE8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Memuat daftar siswa {selectedClass}...
              </div>
            ) : userList.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                Tidak ada data siswa ditemukan di kelas {selectedClass}.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {userList.map((student) => {
                  const selected = isUserSelected(student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleUser(student)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        selected
                          ? "bg-blue-50/80 border-[#2C1EE8] shadow-2xs"
                          : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/80"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                            selected
                              ? "bg-[#2C1EE8] border-[#2C1EE8] text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {student.fullName || student.userName || student.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {student.nis ? `NIS: ${student.nis}` : selectedClass}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Badges Preview */}
          {selectedUsers.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Siswa yang Dipilih ({selectedUsers.length}):
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                {selectedUsers.map((u) => (
                  <span
                    key={u.id || u.userId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-slate-800 border border-slate-200 rounded-xl text-[11px] font-bold shadow-2xs"
                  >
                    <span>{u.fullName}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleUser(u);
                      }}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="text-xs font-bold text-slate-600">
            Total: <span className="text-[#2C1EE8] font-black">{selectedUsers.length} Siswa</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 bg-[#2C1EE8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all"
            >
              Simpan Pilihan ({selectedUsers.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
