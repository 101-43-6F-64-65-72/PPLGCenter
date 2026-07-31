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
  [USER_ROLES.STUDENT]: "Siswa",
  [USER_ROLES.OSIS]: "Pengurus OSIS",
  [USER_ROLES.TEACHER]: "Guru / Pembina",
  [USER_ROLES.ADMIN]: "Administrator / Waka Kesiswaan",
};
