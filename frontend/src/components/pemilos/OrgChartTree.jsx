"use client";

import React, { useMemo } from "react";
import { ShieldCheck, User, Users, GitBranch, Award } from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";

// Clean Enterprise Node Card
function MemberNodeCard({
  name,
  positionTitle,
  badgeText,
  badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-100",
  avatarUrl,
  subText,
  isLeader = false
}) {
  return (
    <div className={`bg-white border transition-all rounded-xl p-3.5 shadow-xs text-center min-w-[170px] max-w-[220px] relative z-10 ${
      isLeader ? "border-indigo-300 shadow-sm ring-2 ring-indigo-500/10" : "border-slate-200 hover:border-slate-300"
    }`}>
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
  cabinetStructureJson = null
}) {
  // Parse & Categorize Members by Role/Hierarchy
  const parsedTreeData = useMemo(() => {
    // Helper to search member by title regex
    const findMember = (predicate) => members.find(predicate);
    const filterMembers = (predicate) => members.filter(predicate);

    // 1. Pembina OSIS
    const supervisor = supervisorInfo
      ? {
          name: supervisorInfo.supervisorTeacherName || supervisorInfo.advisorName || "Drs. Pembina OSIS, M.Pd",
          positionTitle: "Pembina OSIS / Waka Kesiswaan",
          photoUrl: supervisorInfo.imageUrl || supervisorInfo.ImageUrl || null,
        }
      : findMember((m) => m.positionTitle?.toLowerCase().includes("pembina")) || {
          name: "Drs. Supriyanto, M.Pd",
          positionTitle: "Pembina OSIS / Waka Kesiswaan",
        };

    // 2. Ketua OSIS
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

    // 3. Wakil Ketua OSIS
    const viceChairman = findMember((m) => m.positionTitle?.toLowerCase().includes("wakil")) || (
      members.length > 1
        ? { name: members[1]?.studentName || "Wakil Ketua OSIS", positionTitle: "Wakil Ketua OSIS", photoUrl: members[1]?.photoUrl }
        : null
    );

    // 4. Sekretaris 1 & 2
    const secretary1 = findMember(
      (m) => m.positionTitle?.toLowerCase().includes("sekretaris 1") || m.positionTitle === "Sekretaris 1"
    ) || findMember((m) => m.department?.toLowerCase().includes("sekretaris")) || null;

    const secretary2 = findMember(
      (m) => m.positionTitle?.toLowerCase().includes("sekretaris 2") || m.positionTitle === "Sekretaris 2"
    );

    // 5. Bendahara 1 & 2
    const treasurer1 = findMember(
      (m) => m.positionTitle?.toLowerCase().includes("bendahara 1") || m.positionTitle === "Bendahara 1"
    ) || findMember((m) => m.department?.toLowerCase().includes("bendahara")) || null;

    const treasurer2 = findMember(
      (m) => m.positionTitle?.toLowerCase().includes("bendahara 2") || m.positionTitle === "Bendahara 2"
    );

    // 6. Custom Divisions / Sekbid
    // Group remaining members by department (excluding main leaders)
    const divisionMap = {};
    const leaderIds = new Set([chairman?.id, viceChairman?.id, secretary1?.id, secretary2?.id, treasurer1?.id, treasurer2?.id].filter(Boolean));

    members.forEach((m) => {
      if (leaderIds.has(m.id)) return;
      const deptName = m.department || m.positionTitle || "Divisi / Sekbid OSIS";
      // Ignore if department is BPH or Leadership
      if (deptName === "BPH" || deptName.toLowerCase().includes("ketua")) return;

      if (!divisionMap[deptName]) {
        divisionMap[deptName] = [];
      }
      divisionMap[deptName].push(m);
    });

    // Also parse CabinetStructureJson if available
    if (cabinetStructureJson) {
      try {
        const obj = typeof cabinetStructureJson === "string" ? JSON.parse(cabinetStructureJson) : cabinetStructureJson;
        if (Array.isArray(obj.customDivisions)) {
          obj.customDivisions.forEach((d) => {
            const dName = d.divisionName || d.name || "Divisi OSIS";
            if (!divisionMap[dName]) {
              divisionMap[dName] = [{ studentName: d.studentName || d.studentId || "Anggota Divisi", positionTitle: dName }];
            }
          });
        }
      } catch (err) {
        console.error("Error parsing cabinet structure JSON in OrgChartTree:", err);
      }
    }

    const divisions = Object.entries(divisionMap).map(([title, items]) => ({
      title,
      members: items,
    }));

    return {
      supervisor,
      chairman,
      viceChairman,
      secretaries: [secretary1, secretary2].filter(Boolean),
      treasurers: [treasurer1, treasurer2].filter(Boolean),
      divisions,
    };
  }, [members, supervisorInfo, cabinetStructureJson]);

  const { supervisor, chairman, viceChairman, secretaries, treasurers, divisions } = parsedTreeData;

  if (members.length === 0 && !supervisorInfo) {
    return (
      <div className="text-center py-16 text-slate-400 font-sans">
        <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-600" />
        <p className="font-bold text-slate-700 text-sm">Belum Ada Struktur OSIS Aktif</p>
        <p className="text-xs text-slate-400 mt-1">Struktur organisasi akan terisi otomatis setelah pemenang Pemilos ditetapkan.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto py-6 px-2 font-sans select-none">
      <div className="min-w-[760px] flex flex-col items-center space-y-0">

        {/* ═════════════════════════════════════════════════════════════════
            LEVEL 1: PEMBINA OSIS / WAKA KESISWAAN (PALING ATAS)
        ═════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col items-center">
          <MemberNodeCard
            name={supervisor.name}
            positionTitle="Pembina OSIS"
            badgeText="Pembina OSIS / Waka Kesiswaan"
            badgeStyle="bg-emerald-50 text-emerald-700 border-emerald-200"
            avatarUrl={supervisor.photoUrl}
            subText="Pembina Utama"
          />

          {/* Vertical Stem down to Level 2 */}
          <div className="w-0.5 h-8 bg-slate-300" />
        </div>

        {/* ═════════════════════════════════════════════════════════════════
            LEVEL 2: KETUA OSIS & WAKIL KETUA OSIS
        ═════════════════════════════════════════════════════════════════ */}
        <div className="w-full flex flex-col items-center">
          {/* Horizontal Connector Line for Chairman & Vice */}
          <div className="relative flex items-center justify-center w-[360px] sm:w-[420px]">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-300" />
          </div>

          {/* Nodes Container */}
          <div className="flex items-start justify-center gap-12 sm:gap-16 pt-0">
            {/* Cabang Kiri: Ketua OSIS */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-4 bg-slate-300" />
              <MemberNodeCard
                name={chairman.name || chairman.studentName}
                positionTitle="Ketua OSIS"
                badgeText="Ketua OSIS"
                badgeStyle="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold"
                avatarUrl={chairman.photoUrl}
                subText={chairman.className || "Ketua Terpilih"}
                isLeader={true}
              />
            </div>

            {/* Cabang Kanan: Wakil Ketua OSIS */}
            {viceChairman && (
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-4 bg-slate-300" />
                <MemberNodeCard
                  name={viceChairman.name || viceChairman.studentName}
                  positionTitle="Wakil Ketua OSIS"
                  badgeText="Wakil Ketua OSIS"
                  badgeStyle="bg-blue-50 text-blue-700 border-blue-200 font-bold"
                  avatarUrl={viceChairman.photoUrl}
                  subText={viceChairman.className || "Wakil Terpilih"}
                  isLeader={true}
                />
              </div>
            )}
          </div>

          {/* Stem Down from Level 2 to Level 3 */}
          <div className="w-0.5 h-8 bg-slate-300 mt-0" />
        </div>

        {/* ═════════════════════════════════════════════════════════════════
            LEVEL 3: PENGURUS HARIAN (SEKRETARIS & BENDAHARA)
        ═════════════════════════════════════════════════════════════════ */}
        <div className="w-full flex flex-col items-center">
          {/* Horizontal Top Rail connecting Level 3 */}
          <div className="relative flex items-center justify-center w-[580px] sm:w-[680px]">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-300" />
          </div>

          <div className="grid grid-cols-2 gap-16 sm:gap-24 pt-0 w-full max-w-4xl">
            {/* Cabang Kiri: Sekretaris 1 & 2 */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-4 bg-slate-300" />
              <div className="bg-slate-50/80 border border-slate-200/80 p-3.5 rounded-2xl w-full max-w-xs space-y-3 shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 border-b border-slate-200 pb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Sekretaris OSIS</span>
                </div>
                <div className="flex flex-col gap-2.5 items-center">
                  {secretaries.length > 0 ? (
                    secretaries.map((sec, idx) => (
                      <MemberNodeCard
                        key={sec.id || idx}
                        name={sec.studentName || sec.name}
                        positionTitle={sec.positionTitle || `Sekretaris ${idx + 1}`}
                        badgeText={sec.positionTitle || `Sekretaris ${idx + 1}`}
                        badgeStyle="bg-emerald-50 text-emerald-700 border-emerald-200"
                        avatarUrl={sec.photoUrl}
                        subText={sec.className || "BPH OSIS"}
                      />
                    ))
                  ) : (
                    <MemberNodeCard
                      name="Sekretaris 1"
                      positionTitle="Sekretaris 1"
                      badgeText="Sekretaris 1"
                      badgeStyle="bg-emerald-50 text-emerald-700 border-emerald-200"
                      subText="BPH OSIS"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Cabang Kanan: Bendahara 1 & 2 */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-4 bg-slate-300" />
              <div className="bg-slate-50/80 border border-slate-200/80 p-3.5 rounded-2xl w-full max-w-xs space-y-3 shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 border-b border-slate-200 pb-2">
                  <Award className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Bendahara OSIS</span>
                </div>
                <div className="flex flex-col gap-2.5 items-center">
                  {treasurers.length > 0 ? (
                    treasurers.map((tr, idx) => (
                      <MemberNodeCard
                        key={tr.id || idx}
                        name={tr.studentName || tr.name}
                        positionTitle={tr.positionTitle || `Bendahara ${idx + 1}`}
                        badgeText={tr.positionTitle || `Bendahara ${idx + 1}`}
                        badgeStyle="bg-teal-50 text-teal-700 border-teal-200"
                        avatarUrl={tr.photoUrl}
                        subText={tr.className || "BPH OSIS"}
                      />
                    ))
                  ) : (
                    <MemberNodeCard
                      name="Bendahara 1"
                      positionTitle="Bendahara 1"
                      badgeText="Bendahara 1"
                      badgeStyle="bg-teal-50 text-teal-700 border-teal-200"
                      subText="BPH OSIS"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stem Down from Level 3 to Level 4 */}
          <div className="w-0.5 h-8 bg-slate-300 mt-0" />
        </div>

        {/* ═════════════════════════════════════════════════════════════════
            LEVEL 4: DIVISI & SEKBID KUSTOM OSIS (BAGIAN BAWAH)
        ═════════════════════════════════════════════════════════════════ */}
        <div className="w-full flex flex-col items-center">
          {/* Horizontal Rail connecting Divisions */}
          <div className="relative flex items-center justify-center w-full max-w-5xl">
            <div className="absolute top-0 left-4 right-4 h-0.5 bg-slate-300" />
          </div>

          {divisions.length === 0 ? (
            <div className="pt-4 text-center">
              <span className="inline-block px-4 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold">
                Belum ada divisi / sekbid tambahan yang didaftarkan Guru Pembina
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-0 w-full max-w-6xl">
              {divisions.map((div, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-0.5 h-4 bg-slate-300" />
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 w-full shadow-xs hover:border-slate-300 transition-all space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-xs font-bold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                        {div.title}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {div.members.length} Anggota
                      </span>
                    </div>

                    <div className="space-y-2">
                      {div.members.map((m, idx) => (
                        <div key={m.id || idx} className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {m.studentName?.charAt(0) || "A"}
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <p className="text-xs font-bold text-slate-900 truncate">{m.studentName || m.name || "Nama Anggota"}</p>
                            <p className="text-[10px] text-slate-500 truncate">{m.positionTitle || div.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
