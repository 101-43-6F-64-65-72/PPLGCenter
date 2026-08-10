"use client";

import React, { useMemo } from "react";
import { ShieldCheck, Users, GitBranch, Award, Trash2, Star } from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";

// Clean Enterprise Node Card Component
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

export default function OrgChartTree({
  members = [],
  supervisorInfo = null,
  academicYearName = "Periode Aktif",
  cabinetStructureJson = null,
  canManage = false,
  onDeleteMember = null
}) {
  // Parse & Categorize Members by Role/Hierarchy (5 Levels)
  const parsedTreeData = useMemo(() => {
    const findMember = (predicate) => members.find(predicate);

    // LEVEL 1: PEMBINA & PELINDUNG (Waka Kesiswaan & Pembina Utama)
    const primarySupervisor = {
      name: supervisorInfo?.supervisorTeacherName || supervisorInfo?.advisorName || "Eeng Taufan Nirwana, S.Pd.",
      positionTitle: "Waka Kesiswaan & Pembina Utama",
      photoUrl: supervisorInfo?.imageUrl || supervisorInfo?.ImageUrl || null,
    };

    const secondarySupervisor = {
      name: "Drs. Supriyanto, M.Pd",
      positionTitle: "Pembina Pendamping OSIS",
    };

    // LEVEL 2: INTI TERPILIH (Ketua & Wakil OSIS)
    const chairman = findMember(
      (m) =>
        m.positionTitle?.toLowerCase().includes("ketua") &&
        !m.positionTitle?.toLowerCase().includes("wakil") &&
        !m.positionTitle?.toLowerCase().includes("pembina") &&
        !m.positionTitle?.toLowerCase().includes("sekbid") &&
        !m.positionTitle?.toLowerCase().includes("divisi")
    ) || {
      name: members.length > 0 ? members[0]?.studentName || "Ketua OSIS Terpilih" : "Belum Ditetapkan",
      positionTitle: "Ketua OSIS",
      photoUrl: members[0]?.photoUrl,
    };

    const viceChairman = findMember((m) => m.positionTitle?.toLowerCase().includes("wakil")) || (
      members.length > 1
        ? { name: members[1]?.studentName || "Wakil Ketua OSIS", positionTitle: "Wakil Ketua OSIS", photoUrl: members[1]?.photoUrl }
        : { name: "Wakil Ketua OSIS", positionTitle: "Wakil Ketua OSIS" }
    );

    // LEVEL 3: PENGURUS HARIAN (Sekretaris 1 & 2 DAN Bendahara 1 & 2)
    const secretary1 = findMember(
      (m) => m.positionTitle?.toLowerCase().includes("sekretaris 1") || m.positionTitle === "Sekretaris 1"
    ) || findMember((m) => m.department?.toLowerCase().includes("sekretaris")) || {
      name: "Sekretaris 1",
      positionTitle: "Sekretaris 1",
    };

    const secretary2 = findMember(
      (m) => m.positionTitle?.toLowerCase().includes("sekretaris 2") || m.positionTitle === "Sekretaris 2"
    ) || {
      name: "Sekretaris 2",
      positionTitle: "Sekretaris 2",
    };

    const treasurer1 = findMember(
      (m) => m.positionTitle?.toLowerCase().includes("bendahara 1") || m.positionTitle === "Bendahara 1"
    ) || findMember((m) => m.department?.toLowerCase().includes("bendahara")) || {
      name: "Bendahara 1",
      positionTitle: "Bendahara 1",
    };

    const treasurer2 = findMember(
      (m) => m.positionTitle?.toLowerCase().includes("bendahara 2") || m.positionTitle === "Bendahara 2"
    ) || {
      name: "Bendahara 2",
      positionTitle: "Bendahara 2",
    };

    // LEVEL 4: DIVISI & SEKBID
    const divisionMap = {};
    const leaderIds = new Set(
      [chairman?.id, viceChairman?.id, secretary1?.id, secretary2?.id, treasurer1?.id, treasurer2?.id].filter(Boolean)
    );

    members.forEach((m) => {
      if (leaderIds.has(m.id)) return;
      const deptName = m.department || m.positionTitle || "Divisi / Sekbid OSIS";
      if (deptName === "BPH" || deptName.toLowerCase().includes("ketua")) return;

      if (!divisionMap[deptName]) {
        divisionMap[deptName] = [];
      }
      divisionMap[deptName].push(m);
    });

    // Default Divisions fallback if no custom divisions
    if (Object.keys(divisionMap).length === 0) {
      divisionMap["Sekbid Keagamaan & Ketakwaan"] = [
        { id: "d1", studentName: "Koordinator Sekbid Keagamaan", positionTitle: "Koordinator Divisi" }
      ];
      divisionMap["Sekbid Humas & Komunikasi"] = [
        { id: "d2", studentName: "Koordinator Sekbid Humas", positionTitle: "Koordinator Divisi" }
      ];
      divisionMap["Sekbid Olahraga & Kesehatan"] = [
        { id: "d3", studentName: "Koordinator Sekbid Olahraga", positionTitle: "Koordinator Divisi" }
      ];
      divisionMap["Sekbid Bela Negara & Kedisiplinan"] = [
        { id: "d4", studentName: "Koordinator Sekbid Bela Negara", positionTitle: "Koordinator Divisi" }
      ];
    }

    const divisions = Object.entries(divisionMap).map(([title, items]) => ({
      title,
      coordinator: items[0],
      members: items,
    }));

    // LEVEL 5: DAFTAR ANGGOTA AKTIF SELURUH OSIS
    const allActiveMembers = members.filter((m) => m.studentName || m.StudentName);

    return {
      supervisors: [primarySupervisor, secondarySupervisor],
      chairman,
      viceChairman,
      secretaries: [secretary1, secretary2],
      treasurers: [treasurer1, treasurer2],
      divisions,
      allActiveMembers,
    };
  }, [members, supervisorInfo]);

  const { supervisors, chairman, viceChairman, secretaries, treasurers, divisions, allActiveMembers } = parsedTreeData;

  return (
    <div className="w-full overflow-x-auto py-6 px-2 font-sans select-none">
      <div className="min-w-[800px] flex flex-col items-center space-y-0">

        {/* ═════════════════════════════════════════════════════════════════
            LEVEL 1: PEMBINA & PELINDUNG OSIS (PALING ATAS)
        ═════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 shadow-md text-center min-w-[320px] max-w-[420px] relative z-10">
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
                    {sup.photoUrl ? <img src={resolveImageUrl(sup.photoUrl)} alt={sup.name} className="w-full h-full object-cover" /> : sup.name[0]}
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
            LEVEL 2: INTI TERPILIH (KETUA & WAKIL KETUA OSIS)
        ═════════════════════════════════════════════════════════════════ */}
        <div className="w-full flex flex-col items-center">
          {/* Horizontal Rail connecting Level 2 */}
          <div className="relative flex items-center justify-center w-[380px] sm:w-[460px]">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-300" />
          </div>

          <div className="flex items-start justify-center gap-12 sm:gap-16 pt-0">
            {/* Ketua OSIS */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-4 bg-slate-300" />
              <MemberNodeCard
                name={chairman.studentName || chairman.name}
                positionTitle="Ketua OSIS"
                badgeText="Ketua OSIS"
                badgeStyle="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold"
                avatarUrl={chairman.photoUrl}
                subText={chairman.className || "Inti Terpilih"}
                isLeader={true}
                canManage={canManage}
                onDelete={chairman.id ? () => onDeleteMember?.(chairman.id) : null}
              />
            </div>

            {/* Wakil Ketua OSIS */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-4 bg-slate-300" />
              <MemberNodeCard
                name={viceChairman.studentName || viceChairman.name}
                positionTitle="Wakil Ketua OSIS"
                badgeText="Wakil Ketua OSIS"
                badgeStyle="bg-blue-50 text-blue-700 border-blue-200 font-bold"
                avatarUrl={viceChairman.photoUrl}
                subText={viceChairman.className || "Inti Terpilih"}
                isLeader={true}
                canManage={canManage}
                onDelete={viceChairman.id ? () => onDeleteMember?.(viceChairman.id) : null}
              />
            </div>
          </div>

          {/* Stem down to Level 3 */}
          <div className="w-0.5 h-8 bg-slate-300 mt-0" />
        </div>

        {/* ═════════════════════════════════════════════════════════════════
            LEVEL 3: PENGURUS HARIAN (SEKRETARIS 1&2 DAN BENDAHARA 1&2)
        ═════════════════════════════════════════════════════════════════ */}
        <div className="w-full flex flex-col items-center">
          {/* Horizontal Rail connecting Level 3 */}
          <div className="relative flex items-center justify-center w-[600px] sm:w-[720px]">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-300" />
          </div>

          <div className="grid grid-cols-2 gap-12 sm:gap-20 pt-0 w-full max-w-5xl">
            {/* Wadah SEKRETARIS OSIS (DUA KARTU) */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-4 bg-slate-300" />
              <div className="bg-slate-50/90 border border-slate-200 p-4 rounded-2xl w-full max-w-md space-y-3 shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 border-b border-slate-200 pb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Wadah Sekretaris OSIS</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {secretaries.map((sec, idx) => (
                    <MemberNodeCard
                      key={sec.id || idx}
                      name={sec.studentName || sec.name}
                      positionTitle={`Sekretaris ${idx + 1}`}
                      badgeText={`Sekretaris ${idx + 1}`}
                      badgeStyle="bg-emerald-50 text-emerald-700 border-emerald-200"
                      avatarUrl={sec.photoUrl}
                      subText={sec.className || "Pengurus Harian"}
                      canManage={canManage}
                      onDelete={sec.id ? () => onDeleteMember?.(sec.id) : null}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Wadah BENDAHARA OSIS (DUA KARTU) */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-4 bg-slate-300" />
              <div className="bg-slate-50/90 border border-slate-200 p-4 rounded-2xl w-full max-w-md space-y-3 shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 border-b border-slate-200 pb-2">
                  <Award className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Wadah Bendahara OSIS</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {treasurers.map((tr, idx) => (
                    <MemberNodeCard
                      key={tr.id || idx}
                      name={tr.studentName || tr.name}
                      positionTitle={`Bendahara ${idx + 1}`}
                      badgeText={`Bendahara ${idx + 1}`}
                      badgeStyle="bg-teal-50 text-teal-700 border-teal-200"
                      avatarUrl={tr.photoUrl}
                      subText={tr.className || "Pengurus Harian"}
                      canManage={canManage}
                      onDelete={tr.id ? () => onDeleteMember?.(tr.id) : null}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stem down to Level 4 */}
          <div className="w-0.5 h-8 bg-slate-300 mt-0" />
        </div>

        {/* ═════════════════════════════════════════════════════════════════
            LEVEL 4: DIVISI & SEKBID (SEKSI BIDANG) KUSTOM
        ═════════════════════════════════════════════════════════════════ */}
        <div className="w-full flex flex-col items-center">
          {/* Horizontal Rail connecting Level 4 */}
          <div className="relative flex items-center justify-center w-full max-w-6xl">
            <div className="absolute top-0 left-4 right-4 h-0.5 bg-slate-300" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-0 w-full max-w-7xl">
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
                          <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center shrink-0">
                            {m.studentName?.charAt(0) || "A"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{m.studentName || m.name || "Anggota Divisi"}</p>
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
          </div>

          {/* Stem down to Level 5 */}
          <div className="w-0.5 h-8 bg-slate-300 mt-2" />
        </div>

        {/* ═════════════════════════════════════════════════════════════════
            LEVEL 5: DAFTAR TRANSPARAN SELURUH ANGGOTA AKTIF OSIS
        ═════════════════════════════════════════════════════════════════ */}
        <div className="w-full max-w-6xl pt-2">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-slate-900 text-base">LEVEL 5: Direktori Transparan Seluruh Anggota Aktif OSIS</h3>
              </div>
              <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Total {allActiveMembers.length} Pengurus Terdaftar
              </span>
            </div>

            {allActiveMembers.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">Belum ada daftar anggota aktif yang tercatat.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {allActiveMembers.map((mem, idx) => (
                  <div key={mem.id || idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                      {mem.photoUrl ? <img src={resolveImageUrl(mem.photoUrl)} alt="Siswa" className="w-full h-full object-cover" /> : mem.studentName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-xs truncate">{mem.studentName}</p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">{mem.positionTitle || mem.department || "Anggota OSIS"}</p>
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
