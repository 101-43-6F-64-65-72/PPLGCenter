/**
 * System User Roles based on API Contract V1
 */

export const USER_ROLES = {
  STUDENT: "Student",
  OSIS: "OSIS",
  TEACHER: "Teacher",
  ADMIN: "Admin",
};

export const ROLE_LABELS = {
  [USER_ROLES.STUDENT]: "Siswa Biasa",
  [USER_ROLES.OSIS]: "Pengurus OSIS / Ekskul",
  [USER_ROLES.TEACHER]: "Pembina Ekskul / Guru",
  [USER_ROLES.ADMIN]: "Admin (Waka Kesiswaan)",
};
