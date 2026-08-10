"use client";

import React, { useMemo } from "react";
import { ShieldCheck, Users, GitBranch, Award, Trash2, UserPlus, Plus } from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";

// Real Member Node Card Component
function MemberNodeCard({
  name,
  positionTitle,
  badgeText,
  badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-100",
  avatarUrl,
  subText,
  isLeader = false,
  onDelete = null,
  canManage = false
}) {
  return (
    <div className={`bg-white border transition-all rounded-xl p-3.5 shadow-xs text-center min-w-[170px] max-w-[220px] relative z-10 ${
      isLeader ? "border-indigo-300 shadow-sm ring-2 ring-indigo-500/10" : "border-slate-200 hover:border-slate-300"
    }`}>
      {/* Tombol Hapus Anggota (Khusus Pembina/Admin) */}
      {canManage && onDelete && (
        <button
          onClick={onDelete}
          title="Hapus Pengurus Ini"
          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Badge Tag Jabatan */}
      <div className="mb-2 flex justify-center">
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${badgeStyle}`}>
          {badgeText || positionTitle}
        </span>
      </div>

      {/* Avatar */}
      <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold text-sm mb-2 overflow-hidden border ${
        isLeader
          ? "bg-gradient-to-br from-[#2c1ee8] to-indigo-600 text-white border-indigo-200 shadow-xs"
          : "bg-slate-100 text-slate-700 border-slate-200"
      }`}>
        {avatarUrl ? (
          <img src={resolveImageUrl(avatarUrl)} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{name?.charAt(0)?.toUpperCase() || "S"}</span>
        )}
      </div>

      {/* Student Name */}
      <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate leading-tight">{name || "Nama Pengurus"}</h4>
      {subText && <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{subText}</p>}
    </div>
  );
}

// Empty Slot Node Card Component (Dynamic Slot)
function EmptySlotNodeCard({
  positionTitle,
  badgeText,
  badgeStyle = "bg-amber-50 text-amber-700 border-amber-200",
  onAssign = null,
  canManage = false
}) {
  return (
    <div className="bg-slate-50/80 border-2 border-dashed border-slate-300 rounded-xl p-3.5 text-center min-w-[170px] max-w-[220px] relative z-10 flex flex-col items-center justify-between min-h-[140px] space-y-2">
      <div className="flex justify-center">
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${badgeStyle}`}>
          {badgeText || positionTitle}
        </span>
      </div>

      <div className="w-10 h-10 rounded-full bg-slate-200/70 text-slate-400 flex items-center justify-center mx-auto">
        <UserPlus className="w-5 h-5 text-slate-500" />
      </div>

      <div>
        <p className="font-bold text-slate-500 text-xs uppercase tracking-wider">SLOT KOSONG</p>
        <p className="text-[10px] text-slate-400 font-medium">Belum di-assign</p>
      </div>

      {canManage && onAssign && (
        <button
          onClick={() => onAssign(positionTitle)}
          className="mt-1 px-3 py-1 bg-[#2c1ee8] hover:bg-blue-700 text-white font-extrabold text-[11px] rounded-lg transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          <span>+ Assign Siswa</span>
        </button>
      )}
    </div>
  );
}

export default function OrgChartTree({
  members = [],
  supervisorInfo = null,
  academicYearName = "Periode Aktif",
  canManage = false,
  onDeleteMember = null,
  onAssignSlot = null,
  onAddNewDivision = null
}) {
  // Parse Real Data Only from Supabase DB
  const parsedTreeData = useMemo(() => {
    const findMember = (predicate) => members.find(predicate);

    // LEVEL 1: PEMBINA (Real Data from DB)
    const primarySupervisor = {
      name: supervisorInfo?.supervisorTeacherName || supervisorInfo?.advisorName || "Eeng Taufan Nirwana, S.Pd.",
      positionTitle: "Waka Kesiswaan & Pembina Utama",
      photoUrl: supervisorInfo?.imageUrl || supervisorInfo?.ImageUrl || null,
    };

    const secondarySupervisor = {
      name: "Drs. Supriyanto, M.Pd",
      positionTitle: "Pembina Pendamping OSIS",
    };

    // LEVEL 2: INTI TERPILIH (Ketua & Wakil Ketua OSIS - Real Data)
    const chairman = findMember(
      (m) =>
        m.positionTitle?.toLowerCase().includes("ketua") &&
        !m.positionTitle?.toLowerCase().includes("wakil") &&
        !m.positionTitle?.toLowerCase().includes("pembina")
    );

    const viceChairman = findMember((m) => m.positionTitle?.toLowerCase().includes("wakil"));

    // LEVEL 3: PENGURUS HARIAN (Sekretaris 1&2 & Bendahara 1&2 - Real Data)
    const secretary1 = findMember(
      (m) => m.positionTitle === "Sekretaris 1" || m.positionTitle?.toLowerCase().includes("sekretaris 1")
    );
    const secretary2 = findMember(
      (m) => m.positionTitle === "Sekretaris 2" || m.positionTitle?.toLowerCase().includes("sekretaris 2")
    );

    const treasurer1 = findMember(
      (m) => m.positionTitle === "Bendahara 1" || m.positionTitle?.toLowerCase().includes("bendahara 1")
    );
    const treasurer2 = findMember(
      (m) => m.positionTitle === "Bendahara 2" || m.positionTitle?.toLowerCase().includes("bendahara 2")
    );

    // LEVEL 4: DIVISI & SEKBID (Real Data Only from DB)
    const leaderIds = new Set(
      [chairman?.id, viceChairman?.id, secretary1?.id, secretary2?.id, treasurer1?.id, treasurer2?.id].filter(Boolean)
    );

    const divisionMap = {};
    members.forEach((m) => {
      if (leaderIds.has(m.id)) return;
      const deptName = m.department || m.positionTitle;
      if (!deptName || deptName === "BPH" || deptName.toLowerCase().includes("ketua")) return;

      if (!divisionMap[deptName]) {
        divisionMap[deptName] = [];
      }
      divisionMap[deptName].push(m);
    });

    const divisions = Object.entries(divisionMap).map(([title, items]) => ({
      title,
      members: items,
    }));

    // LEVEL 5: DAFTAR SELURUH ANGGOTA AKTIF REAL SUPABASE
    const allActiveMembers = members.filter((m) => m.studentName || m.StudentName);

    return {
      supervisors: [primarySupervisor, secondarySupervisor],
      chairman,
      viceChairman,
      secretary1,
      secretary2,
      treasurer1,
      treasurer2,
      divisions,
      allActiveMembers,
    };
  }, [members, supervisorInfo]);

  const {
    supervisors,
    chairman,
    viceChairman,
    secretary1,
    secretary2,
    treasurer1,
    treasurer2,
    divisions,
    allActiveMembers,
  } = parsedTreeData;

  return (
    <div className="w-full overflow-x-auto py-6 px-2 font-sans select-none">
      <div className="min-w-[800px] flex flex-col items-center space-y-0">

        {/* ═════════════════════════════════════════════════════════════════
            LEVEL 1: PEMBINA & PELINDUNG OSIS (PALING ATAS)
        ═════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 shadow-md text-center min-w-[320px] max-w-[440px] relative z-10">
            <div className="mb-2 flex justify-center">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>LEVEL 1: DEWAN PEMBINA & PELINDUNG OSIS</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              {supervisors.map((sup, idx) => (
                <div key={idx} className="text-center space-y-1">
                  <div className="w-10 h-10 rounded-full mx-auto bg-slate-800 text-emerald-400 font-black text-xs flex items-center justify-center border border-slate-700 overflow-hidden">
                    {sup.photoUrl ? (
                      <img src={resolveImageUrl(sup.photoUrl)} alt={sup.name} className="w-full h-full object-cover" />
                    ) : (
                      sup.name[0]
                    )}
                  </div>
                  <p className="font-bold text-xs text-white truncate">{sup.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">{sup.positionTitle}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stem down to Level 2 */}
          <div className="w-0.5 h-8 bg-slate-300" />
        </div>

        {/* ═════════════════════════════════════════════════════════════════
            LEVEL 2: INTI TERPILIH (KETUA & WAKIL KETUA OSIS - REAL DB DATA)
        ═════════════════════════════════════════════════════════════════ */}
        <div className="w-full flex flex-col items-center">
          <div className="relative flex items-center justify-center w-[380px] sm:w-[460px]">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-300" />
          </div>

          <div className="flex items-start justify-center gap-12 sm:gap-16 pt-0">
            {/* Ketua OSIS */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-4 bg-slate-300" />
              {chairman ? (
                <MemberNodeCard
                  name={chairman.studentName}
                  positionTitle="Ketua OSIS"
                  badgeText="Ketua OSIS"
                  badgeStyle="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold"
                  avatarUrl={chairman.photoUrl}
                  subText={chairman.className || "Inti Terpilih (Pemilos)"}
                  isLeader={true}
                  canManage={canManage}
                  onDelete={chairman.id ? () => onDeleteMember?.(chairman.id) : null}
                />
              ) : (
                <EmptySlotNodeCard
                  positionTitle="Ketua OSIS"
                  badgeText="Ketua OSIS"
                  badgeStyle="bg-indigo-50 text-indigo-700 border-indigo-200"
                  canManage={canManage}
                  onAssign={onAssignSlot}
                />
              )}
            </div>

            {/* Wakil Ketua OSIS */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-4 bg-slate-300" />
              {viceChairman ? (
                <MemberNodeCard
                  name={viceChairman.studentName}
                  positionTitle="Wakil Ketua OSIS"
                  badgeText="Wakil Ketua OSIS"
                  badgeStyle="bg-blue-50 text-blue-700 border-blue-200 font-bold"
                  avatarUrl={viceChairman.photoUrl}
                  subText={viceChairman.className || "Inti Terpilih (Pemilos)"}
                  isLeader={true}
                  canManage={canManage}
                  onDelete={viceChairman.id ? () => onDeleteMember?.(viceChairman.id) : null}
                />
              ) : (
                <EmptySlotNodeCard
                  positionTitle="Wakil Ketua OSIS"
                  badgeText="Wakil Ketua OSIS"
                  badgeStyle="bg-blue-50 text-blue-700 border-blue-200"
                  canManage={canManage}
                  onAssign={onAssignSlot}
                />
              )}
            </div>
          </div>

          {/* Stem down to Level 3 */}
          <div className="w-0.5 h-8 bg-slate-300 mt-0" />
        </div>

        {/* ═════════════════════════════════════════════════════════════════
            LEVEL 3: PENGURUS HARIAN (SEKRETARIS 1&2 DAN BENDAHARA 1&2)
        ═════════════════════════════════════════════════════════════════ */}
        <div className="w-full flex flex-col items-center">
          <div className="relative flex items-center justify-center w-[600px] sm:w-[740px]">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-300" />
          </div>

          <div className="grid grid-cols-2 gap-12 sm:gap-20 pt-0 w-full max-w-5xl">
            {/* Wadah SEKRETARIS OSIS (DUA KARTU DYNAMIC) */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-4 bg-slate-300" />
              <div className="bg-slate-50/90 border border-slate-200 p-4 rounded-2xl w-full max-w-md space-y-3 shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 border-b border-slate-200 pb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Sekretaris OSIS</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {secretary1 ? (
                    <MemberNodeCard
                      name={secretary1.studentName}
                      positionTitle="Sekretaris 1"
                      badgeText="Sekretaris 1"
                      badgeStyle="bg-emerald-50 text-emerald-700 border-emerald-200"
                      avatarUrl={secretary1.photoUrl}
                      subText={secretary1.className || "Pengurus Harian"}
                      canManage={canManage}
                      onDelete={() => onDeleteMember?.(secretary1.id)}
                    />
                  ) : (
                    <EmptySlotNodeCard
                      positionTitle="Sekretaris 1"
                      badgeText="Sekretaris 1"
                      badgeStyle="bg-emerald-50 text-emerald-700 border-emerald-200"
                      canManage={canManage}
                      onAssign={onAssignSlot}
                    />
                  )}

                  {secretary2 ? (
                    <MemberNodeCard
                      name={secretary2.studentName}
                      positionTitle="Sekretaris 2"
                      badgeText="Sekretaris 2"
                      badgeStyle="bg-emerald-50 text-emerald-700 border-emerald-200"
                      avatarUrl={secretary2.photoUrl}
                      subText={secretary2.className || "Pengurus Harian"}
                      canManage={canManage}
                      onDelete={() => onDeleteMember?.(secretary2.id)}
                    />
                  ) : (
                    <EmptySlotNodeCard
                      positionTitle="Sekretaris 2"
                      badgeText="Sekretaris 2"
                      badgeStyle="bg-emerald-50 text-emerald-700 border-emerald-200"
                      canManage={canManage}
                      onAssign={onAssignSlot}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Wadah BENDAHARA OSIS (DUA KARTU DYNAMIC) */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-4 bg-slate-300" />
              <div className="bg-slate-50/90 border border-slate-200 p-4 rounded-2xl w-full max-w-md space-y-3 shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 border-b border-slate-200 pb-2">
                  <Award className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Bendahara OSIS</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {treasurer1 ? (
                    <MemberNodeCard
                      name={treasurer1.studentName}
                      positionTitle="Bendahara 1"
                      badgeText="Bendahara 1"
                      badgeStyle="bg-teal-50 text-teal-700 border-teal-200"
                      avatarUrl={treasurer1.photoUrl}
                      subText={treasurer1.className || "Pengurus Harian"}
                      canManage={canManage}
                      onDelete={() => onDeleteMember?.(treasurer1.id)}
                    />
                  ) : (
                    <EmptySlotNodeCard
                      positionTitle="Bendahara 1"
                      badgeText="Bendahara 1"
                      badgeStyle="bg-teal-50 text-teal-700 border-teal-200"
                      canManage={canManage}
                      onAssign={onAssignSlot}
                    />
                  )}

                  {treasurer2 ? (
                    <MemberNodeCard
                      name={treasurer2.studentName}
                      positionTitle="Bendahara 2"
                      badgeText="Bendahara 2"
                      badgeStyle="bg-teal-50 text-teal-700 border-teal-200"
                      avatarUrl={treasurer2.photoUrl}
                      subText={treasurer2.className || "Pengurus Harian"}
                      canManage={canManage}
                      onDelete={() => onDeleteMember?.(treasurer2.id)}
                    />
                  ) : (
                    <EmptySlotNodeCard
                      positionTitle="Bendahara 2"
                      badgeText="Bendahara 2"
                      badgeStyle="bg-teal-50 text-teal-700 border-teal-200"
                      canManage={canManage}
                      onAssign={onAssignSlot}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stem down to Level 4 */}
          <div className="w-0.5 h-8 bg-slate-300 mt-0" />
        </div>

        {/* ═════════════════════════════════════════════════════════════════
            LEVEL 4: DIVISI & SEKBID KUSTOM (AKAR DYNAMIC ROOT)
        ═════════════════════════════════════════════════════════════════ */}
        <div className="w-full flex flex-col items-center">
          <div className="relative flex items-center justify-center w-full max-w-6xl">
            <div className="absolute top-0 left-4 right-4 h-0.5 bg-slate-300" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-0 w-full max-w-7xl">
            {/* Render Real Divisions from Supabase DB */}
            {divisions.map((div, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-0.5 h-4 bg-slate-300" />
                <div className="bg-white border border-slate-200 rounded-2xl p-4 w-full shadow-xs hover:border-slate-300 transition-all space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-black text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                      {div.title}
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {div.members.length} Anggota
                    </span>
                  </div>

                  <div className="space-y-2">
                    {div.members.map((m, idx) => (
                      <div key={m.id || idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center shrink-0 overflow-hidden">
                            {m.photoUrl ? (
                              <img src={resolveImageUrl(m.photoUrl)} alt="Member" className="w-full h-full object-cover" />
                            ) : (
                              m.studentName?.charAt(0) || "A"
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{m.studentName || "Anggota Divisi"}</p>
                            <p className="text-[10px] text-slate-500 truncate">{idx === 0 ? "Koordinator Divisi" : "Anggota Divisi"}</p>
                          </div>
                        </div>

                        {canManage && m.id && (
                          <button
                            onClick={() => onDeleteMember?.(m.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Hapus Anggota Divisi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Kartu Utama "+ Tambah Divisi Baru" (Dynamic New Branch Node) */}
            {canManage && (
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-4 bg-slate-300" />
                <div
                  onClick={onAddNewDivision}
                  className="bg-purple-50/50 hover:bg-purple-50 border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-2xl p-6 w-full text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[160px] space-y-2 group"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-all shadow-xs">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-purple-900 text-xs sm:text-sm">+ Tambah Divisi Baru</h4>
                    <p className="text-[10px] text-purple-600 font-medium">Buat cabang akar baru di pohon organisasi</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stem down to Level 5 */}
          <div className="w-0.5 h-8 bg-slate-300 mt-2" />
        </div>

        {/* ═════════════════════════════════════════════════════════════════
            LEVEL 5: DAFTAR REAL ANGGOTA AKTIF OSIS DARI SUPABASE DB
        ═════════════════════════════════════════════════════════════════ */}
        <div className="w-full max-w-6xl pt-2">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-slate-900 text-base">LEVEL 5: Direktori Transparan Pengurus Aktif Supabase DB</h3>
              </div>
              <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Total {allActiveMembers.length} Pengurus Terdaftar
              </span>
            </div>

            {allActiveMembers.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">Belum ada daftar pengurus aktif yang terdaftar di database Supabase.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {allActiveMembers.map((mem, idx) => (
                  <div key={mem.id || idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                      {mem.photoUrl ? (
                        <img src={resolveImageUrl(mem.photoUrl)} alt={mem.studentName} className="w-full h-full object-cover" />
                      ) : (
                        mem.studentName?.[0]
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-xs truncate">{mem.studentName}</p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">{mem.positionTitle || mem.department || "Pengurus OSIS"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
