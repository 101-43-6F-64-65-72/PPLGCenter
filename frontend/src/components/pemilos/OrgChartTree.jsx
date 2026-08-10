"use client";

import React, { useMemo } from "react";
import { ShieldCheck, Users, Award, Trash2, UserPlus, Plus, UserCheck } from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";

// Real Member Node Card Component (Clean Enterprise Aesthetic)
function MemberNodeCard({
  name,
  positionTitle,
  badgeText,
  badgeStyle = "bg-slate-100 text-slate-700 border-slate-200",
  avatarUrl,
  subText,
  isLeader = false,
  onDelete = null,
  canManage = false
}) {
  return (
    <div className={`bg-white border transition-all rounded-lg p-3.5 shadow-xs text-center min-w-[170px] max-w-[210px] relative z-10 ${
      isLeader ? "border-slate-300 ring-1 ring-slate-400/20" : "border-slate-200 hover:border-slate-300"
    }`}>
      {/* Tombol Hapus Anggota (Khusus Pembina/Admin) */}
      {canManage && onDelete && (
        <button
          onClick={onDelete}
          title="Hapus Pengurus Ini"
          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
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
      <div className="w-11 h-11 rounded-full mx-auto flex items-center justify-center font-bold text-xs mb-2 overflow-hidden border border-slate-200 bg-slate-100 text-slate-700">
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

// Empty Slot Node Card Component (Clean Dynamic Slot)
function EmptySlotNodeCard({
  positionTitle,
  badgeText,
  badgeStyle = "bg-slate-100 text-slate-600 border-slate-200",
  onAssign = null,
  canManage = false
}) {
  return (
    <div className="bg-slate-50/70 border border-dashed border-slate-300 rounded-lg p-3.5 text-center min-w-[170px] max-w-[210px] relative z-10 flex flex-col items-center justify-between min-h-[135px] space-y-2">
      <div className="flex justify-center">
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${badgeStyle}`}>
          {badgeText || positionTitle}
        </span>
      </div>

      <div className="w-9 h-9 rounded-full bg-slate-200/60 text-slate-400 flex items-center justify-center mx-auto">
        <UserPlus className="w-4 h-4 text-slate-500" />
      </div>

      <div>
        <p className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">SLOT KOSONG</p>
        <p className="text-[10px] text-slate-400 font-medium">Belum di-assign</p>
      </div>

      {canManage && onAssign && (
        <button
          onClick={() => onAssign(positionTitle)}
          className="mt-1 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-md transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
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
  allOsisMembers = [],
  supervisorInfo = null,
  academicYearName = "Periode Aktif",
  canManage = false,
  onDeleteMember = null,
  onAssignSlot = null,
  onAddNewDivision = null,
  onPromoteMember = null
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

    // EXCLUSION FILTER FOR LEVEL 5: UNASSIGNED MEMBERS ONLY
    const assignedStudentIds = new Set();
    members.forEach((m) => {
      const sId = (m.studentId || m.StudentId || m.id || "").toLowerCase();
      if (sId) assignedStudentIds.add(sId);
    });

    let unassignedMembers = [];
    const poolSource = Array.isArray(allOsisMembers) && allOsisMembers.length > 0 ? allOsisMembers : [];

    unassignedMembers = poolSource.filter((m) => {
      const sId = (m.studentId || m.StudentId || m.id || "").toLowerCase();
      return sId && !assignedStudentIds.has(sId);
    });

    return {
      supervisors: [primarySupervisor, secondarySupervisor],
      chairman,
      viceChairman,
      secretary1,
      secretary2,
      treasurer1,
      treasurer2,
      divisions,
      unassignedMembers,
    };
  }, [members, allOsisMembers, supervisorInfo]);

  const {
    supervisors,
    chairman,
    viceChairman,
    secretary1,
    secretary2,
    treasurer1,
    treasurer2,
    divisions,
    unassignedMembers,
  } = parsedTreeData;

  return (
    <div className="w-full overflow-x-auto py-6 px-2 font-sans select-none">
      <div className="min-w-[800px] flex flex-col items-center space-y-0">

        {/* ═════════════════════════════════════════════════════════════════
            DEWAN PEMBINA OSIS (CLEAN ENTERPRISE CARD)
        ═════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col items-center">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-center min-w-[320px] max-w-[440px] relative z-10">
            <div className="mb-2.5 flex justify-center">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                <span>Dewan Pembina OSIS</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-slate-100">
              {supervisors.map((sup, idx) => (
                <div key={idx} className="text-center space-y-1">
                  <div className="w-10 h-10 rounded-full mx-auto bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 overflow-hidden">
                    {sup.photoUrl ? (
                      <img src={resolveImageUrl(sup.photoUrl)} alt={sup.name} className="w-full h-full object-cover" />
                    ) : (
                      sup.name[0]
                    )}
                  </div>
                  <p className="font-bold text-xs text-slate-900 truncate">{sup.name}</p>
                  <p className="text-[10px] text-slate-500 font-medium truncate">{sup.positionTitle}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stem down to Pengurus Inti */}
          <div className="w-0.5 h-8 bg-slate-300" />
        </div>

        {/* ═════════════════════════════════════════════════════════════════
            PENGURUS INTI OSIS (KETUA & WAKIL KETUA)
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
                  badgeStyle="bg-slate-100 text-slate-800 border-slate-200 font-bold"
                  avatarUrl={chairman.photoUrl}
                  subText={chairman.className || "Terpilih (Pemilos)"}
                  isLeader={true}
                  canManage={canManage}
                  onDelete={chairman.id ? () => onDeleteMember?.(chairman.id) : null}
                />
              ) : (
                <EmptySlotNodeCard
                  positionTitle="Ketua OSIS"
                  badgeText="Ketua OSIS"
                  badgeStyle="bg-slate-100 text-slate-700 border-slate-200"
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
                  badgeStyle="bg-slate-100 text-slate-800 border-slate-200 font-bold"
                  avatarUrl={viceChairman.photoUrl}
                  subText={viceChairman.className || "Terpilih (Pemilos)"}
                  isLeader={true}
                  canManage={canManage}
                  onDelete={viceChairman.id ? () => onDeleteMember?.(viceChairman.id) : null}
                />
              ) : (
                <EmptySlotNodeCard
                  positionTitle="Wakil Ketua OSIS"
                  badgeText="Wakil Ketua OSIS"
                  badgeStyle="bg-slate-100 text-slate-700 border-slate-200"
                  canManage={canManage}
                  onAssign={onAssignSlot}
                />
              )}
            </div>
          </div>

          {/* Stem down to Pengurus Harian */}
          <div className="w-0.5 h-8 bg-slate-300 mt-0" />
        </div>

        {/* ═════════════════════════════════════════════════════════════════
            PENGURUS HARIAN (SEKRETARIS & BENDAHARA)
        ═════════════════════════════════════════════════════════════════ */}
        <div className="w-full flex flex-col items-center">
          <div className="relative flex items-center justify-center w-[600px] sm:w-[740px]">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-300" />
          </div>

          <div className="grid grid-cols-2 gap-12 sm:gap-20 pt-0 w-full max-w-5xl">
            {/* Wadah SEKRETARIS OSIS */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-4 bg-slate-300" />
              <div className="bg-slate-50/80 border border-slate-200 p-4 rounded-lg w-full max-w-md space-y-3 shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 border-b border-slate-200 pb-2">
                  <ShieldCheck className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Sekretaris OSIS</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {secretary1 ? (
                    <MemberNodeCard
                      name={secretary1.studentName}
                      positionTitle="Sekretaris 1"
                      badgeText="Sekretaris 1"
                      badgeStyle="bg-slate-100 text-slate-700 border-slate-200"
                      avatarUrl={secretary1.photoUrl}
                      subText={secretary1.className || "Pengurus Harian"}
                      canManage={canManage}
                      onDelete={() => onDeleteMember?.(secretary1.id)}
                    />
                  ) : (
                    <EmptySlotNodeCard
                      positionTitle="Sekretaris 1"
                      badgeText="Sekretaris 1"
                      badgeStyle="bg-slate-100 text-slate-700 border-slate-200"
                      canManage={canManage}
                      onAssign={onAssignSlot}
                    />
                  )}

                  {secretary2 ? (
                    <MemberNodeCard
                      name={secretary2.studentName}
                      positionTitle="Sekretaris 2"
                      badgeText="Sekretaris 2"
                      badgeStyle="bg-slate-100 text-slate-700 border-slate-200"
                      avatarUrl={secretary2.photoUrl}
                      subText={secretary2.className || "Pengurus Harian"}
                      canManage={canManage}
                      onDelete={() => onDeleteMember?.(secretary2.id)}
                    />
                  ) : (
                    <EmptySlotNodeCard
                      positionTitle="Sekretaris 2"
                      badgeText="Sekretaris 2"
                      badgeStyle="bg-slate-100 text-slate-700 border-slate-200"
                      canManage={canManage}
                      onAssign={onAssignSlot}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Wadah BENDAHARA OSIS */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-4 bg-slate-300" />
              <div className="bg-slate-50/80 border border-slate-200 p-4 rounded-lg w-full max-w-md space-y-3 shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 border-b border-slate-200 pb-2">
                  <Award className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Bendahara OSIS</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {treasurer1 ? (
                    <MemberNodeCard
                      name={treasurer1.studentName}
                      positionTitle="Bendahara 1"
                      badgeText="Bendahara 1"
                      badgeStyle="bg-slate-100 text-slate-700 border-slate-200"
                      avatarUrl={treasurer1.photoUrl}
                      subText={treasurer1.className || "Pengurus Harian"}
                      canManage={canManage}
                      onDelete={() => onDeleteMember?.(treasurer1.id)}
                    />
                  ) : (
                    <EmptySlotNodeCard
                      positionTitle="Bendahara 1"
                      badgeText="Bendahara 1"
                      badgeStyle="bg-slate-100 text-slate-700 border-slate-200"
                      canManage={canManage}
                      onAssign={onAssignSlot}
                    />
                  )}

                  {treasurer2 ? (
                    <MemberNodeCard
                      name={treasurer2.studentName}
                      positionTitle="Bendahara 2"
                      badgeText="Bendahara 2"
                      badgeStyle="bg-slate-100 text-slate-700 border-slate-200"
                      avatarUrl={treasurer2.photoUrl}
                      subText={treasurer2.className || "Pengurus Harian"}
                      canManage={canManage}
                      onDelete={() => onDeleteMember?.(treasurer2.id)}
                    />
                  ) : (
                    <EmptySlotNodeCard
                      positionTitle="Bendahara 2"
                      badgeText="Bendahara 2"
                      badgeStyle="bg-slate-100 text-slate-700 border-slate-200"
                      canManage={canManage}
                      onAssign={onAssignSlot}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stem down to Seksi Bidang */}
          <div className="w-0.5 h-8 bg-slate-300 mt-0" />
        </div>

        {/* ═════════════════════════════════════════════════════════════════
            SEKSI BIDANG & DEPARTEMEN
        ═════════════════════════════════════════════════════════════════ */}
        <div className="w-full flex flex-col items-center">
          <div className="relative flex items-center justify-center w-full max-w-6xl">
            <div className="absolute top-0 left-4 right-4 h-0.5 bg-slate-300" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-0 w-full max-w-7xl">
            {/* Render Real Divisions */}
            {divisions.map((div, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-0.5 h-4 bg-slate-300" />
                <div className="bg-white border border-slate-200 rounded-lg p-4 w-full shadow-xs hover:border-slate-300 transition-all space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                      {div.title}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                      {div.members.length} Anggota
                    </span>
                  </div>

                  <div className="space-y-2">
                    {div.members.map((m, idx) => (
                      <div key={m.id || idx} className="flex items-center justify-between p-2 rounded-md bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden border border-slate-300">
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

            {/* Kartu Utama "+ Tambah Divisi Baru" */}
            {canManage && (
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-4 bg-slate-300" />
                <div
                  onClick={onAddNewDivision}
                  className="bg-slate-50/60 hover:bg-slate-100 border border-dashed border-slate-300 hover:border-slate-400 rounded-lg p-5 w-full text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[150px] space-y-2 group"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center transition-all shadow-xs">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">+ Tambah Divisi Baru</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Buat cabang baru di pohon organisasi</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stem down to Anggota OSIS */}
          <div className="w-0.5 h-8 bg-slate-300 mt-2" />
        </div>

        {/* ═════════════════════════════════════════════════════════════════
            DAFTAR ANGGOTA BIASA OSIS (UNASSIGNED MEMBERS ONLY)
        ═════════════════════════════════════════════════════════════════ */}
        <div className="w-full max-w-6xl pt-2">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-700" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">👥 Daftar Anggota OSIS (Belum Masuk Divisi)</h3>
                  <p className="text-xs text-slate-500 font-medium">Siswa anggota OSIS yang belum di-assign jabatan di tree atas</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-md border border-slate-200 self-start sm:self-auto">
                Total {unassignedMembers.length} Anggota Belum Di-assign
              </span>
            </div>

            {unassignedMembers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-1">
                <UserCheck className="w-7 h-7 mx-auto text-emerald-600 mb-1" />
                <p className="text-xs font-bold text-slate-700">Seluruh Anggota Telah Di-assign</p>
                <p className="text-[11px] text-slate-400">Tidak ada anggota biasa yang belum memiliki jabatan di pohon organisasi.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {unassignedMembers.map((mem, idx) => {
                  const studentName = mem.studentName || mem.name || "Siswa OSIS";
                  const studentId = mem.studentId || mem.id;
                  const photoUrl = mem.photoUrl || mem.PhotoUrl || mem.imageUrl;

                  return (
                    <div
                      key={studentId || idx}
                      className="p-3 rounded-lg bg-slate-50/70 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/50 flex items-center justify-between gap-2.5 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden border border-slate-300">
                          {photoUrl ? (
                            <img src={resolveImageUrl(photoUrl)} alt={studentName} className="w-full h-full object-cover" />
                          ) : (
                            studentName?.[0]?.toUpperCase() || "S"
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate">{studentName}</p>
                          <p className="text-[10px] text-slate-500 font-medium truncate">{mem.className || "Anggota OSIS"}</p>
                        </div>
                      </div>

                      {canManage && onPromoteMember && (
                        <button
                          onClick={() => onPromoteMember(studentId)}
                          className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-colors shrink-0 cursor-pointer flex items-center gap-1 shadow-xs"
                          title="Angkat menjadi pengurus di tree atas"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Assign</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
