/**
 * Frontend Normalization Layer
 * Aligns frontend data models with latest Supabase PostgreSQL / EF Core Database Schema.
 * Enables parallel frontend-backend development using fallback values when endpoints haven't populated new fields yet.
 */

/**
 * Normalize User object from backend API or auth state
 */
export function normalizeUser(data) {
  if (!data) return null;

  return {
    id: data.id ?? data.userId ?? null,
    fullName: data.fullName ?? data.name ?? "",
    email: data.email ?? data.identifier ?? "",
    role: data.role ?? "Student",
    isActive: data.isActive ?? true,

    // Role Specific & Identification Fields
    nip: data.nip ?? data.NIP ?? null,
    nis: data.nis ?? data.NIS ?? null,
    nisn: data.nisn ?? data.NISN ?? null,

    phoneNumber: data.phoneNumber ?? data.phone ?? null,
    photoUrl: data.photoUrl ?? data.avatar ?? data.imageUrl ?? null,
    username: data.username ?? null,
    address: data.address ?? null,
    birthDate: data.birthDate ?? null,
    classId: data.classId ?? null,
    className: data.className ?? data.class ?? null,
    gender: data.gender ?? null,
    position: data.position ?? null,
    studentNumber: data.studentNumber ?? null,

    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

/**
 * Normalize Extracurricular object
 */
export function normalizeExtracurricular(data) {
  if (!data) return null;

  return {
    id: data.id ?? null,
    name: data.name ?? "",
    description: data.description ?? "",
    imageUrl: data.imageUrl ?? data.image ?? "/images/ekskul/default.jpg",
    category: data.category ?? "Umum",
    maxMembers: data.maxMembers ?? 0,
    currentMembers: data.currentMembers ?? data.membersCount ?? 0,
    isActive: data.isActive ?? true,
    managedByUserId: data.managedByUserId ?? null,

    // Advisor & Schedule Fields
    advisorName: data.advisorName ?? data.pembina ?? null,
    advisorWhatsapp: data.advisorWhatsapp ?? data.waPembina ?? null,
    location: data.location ?? data.lokasi ?? null,
    scheduleDay: data.scheduleDay ?? data.hari ?? null,
    scheduleTime: data.scheduleTime ?? data.jam ?? null,

    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

/**
 * Normalize ExtracurricularMember object
 */
export function normalizeExtracurricularMember(data) {
  if (!data) return null;

  const positionNum = Number(data.position ?? 0);
  let posLabel = "Anggota";
  if (positionNum === 1) posLabel = "Ketua";
  else if (positionNum === 2) posLabel = "Wakil Ketua";
  else if (positionNum === 3) posLabel = "Sekretaris";
  else if (positionNum === 4) posLabel = "Bendahara";

  return {
    id: data.id ?? null,
    extracurricularId: data.extracurricularId ?? null,
    studentId: data.studentId ?? null,
    studentName: data.studentName ?? data.student?.fullName ?? data.user?.fullName ?? "Siswa",
    studentNis: data.studentNis ?? data.student?.nis ?? data.user?.nis ?? "-",
    joinedAt: data.joinedAt ?? data.joinDate ?? null,
    position: positionNum,
    positionLabel: data.positionLabel ?? posLabel,
    status: data.status ?? "Active",
  };
}

/**
 * Normalize Facility object
 */
export function normalizeFacility(data) {
  if (!data) return null;

  return {
    id: data.id ?? null,
    name: data.name ?? data.title ?? "",
    description: data.description ?? "",
    location: data.location ?? "",
    capacity: data.capacity ?? 0,
    category: data.category ?? "Fasilitas Umum",
    imageUrl: data.imageUrl ?? data.imageSrc ?? "/images/tempat/lapangansmkn2ska.jpg",
    model3dUrl: data.model3dUrl ?? data.model3DUrl ?? data.Model3DUrl ?? null,
    isActive: data.isActive ?? true,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

/**
 * Normalize CalendarEvent object
 */
export function normalizeCalendarEvent(data) {
  if (!data) return null;

  return {
    id: data.id ?? null,
    title: data.title ?? "",
    description: data.description ?? "",
    startDate: data.startDate ?? data.date ?? null,
    endDate: data.endDate ?? data.end ?? null,
    location: data.location ?? "Sekolah",
    category: data.category ?? "Akademik",
    isAllDay: Boolean(data.isAllDay),
    createdByUserId: data.createdByUserId ?? null,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

/**
 * Normalize Notification object
 */
export function normalizeNotification(data) {
  if (!data) return null;

  return {
    id: data.id ?? null,
    userId: data.userId ?? null,
    title: data.title ?? "",
    message: data.message ?? "",
    type: data.type ?? 0, // 0=Info, 1=Warning, 2=Success, 3=Proposal, 4=Booking
    referenceId: data.referenceId ?? null,
    referenceType: data.referenceType ?? null,
    isRead: Boolean(data.isRead),
    createdAt: data.createdAt ?? null,
  };
}
