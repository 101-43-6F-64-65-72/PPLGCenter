/**
 * Centralized Permission Authorization Helper
 * Validates granular capabilities granted via backend UserPermission model.
 */

export const PERMISSIONS = {
  MANAGE_TREE: "class.manage.tree",
  APPROVE_FACILITY: "facility.approve",
  MANAGE_FACILITY: "facility.manage",
  APPROVE_BOOK: "book.approve",
  MANAGE_BOOK: "book.manage",
  REVIEW_PROPOSAL: "proposal.review",
};

/**
 * Check if the user possesses a specific capability.
 * @param {string[]} permissions - List of permission capability strings
 * @param {string} capability - Capability key to verify
 */
export function hasPermission(permissions = [], capability) {
  if (!capability || !Array.isArray(permissions)) return false;
  return permissions.some(
    (p) => typeof p === "string" && p.toLowerCase() === capability.toLowerCase()
  );
}

/**
 * Check if the user possesses any of the specified capabilities.
 * @param {string[]} permissions
 * @param {string[]} capabilities
 */
export function hasAnyPermission(permissions = [], capabilities = []) {
  if (!Array.isArray(capabilities) || capabilities.length === 0) return false;
  return capabilities.some((cap) => hasPermission(permissions, cap));
}

/**
 * Check base role match (Admin, Teacher, Student).
 * @param {string} userRole
 * @param {string|string[]} targetRole
 */
export function hasRole(userRole, targetRole) {
  if (!userRole) return false;
  const roleUpper = userRole.toString().toUpperCase();
  if (Array.isArray(targetRole)) {
    return targetRole.some((r) => r.toUpperCase() === roleUpper);
  }
  return roleUpper === targetRole.toString().toUpperCase();
}

/**
 * Helper to check whether user can manage a specific class tree.
 */
export function canManageClass(user, schoolClassId, activeLeadership = null) {
  if (!user) return false;
  if (isAdminOrPplgTeacher(user, user.role)) return true;
  
  if (hasRole(user.role, "Student") && activeLeadership && schoolClassId) {
    return (
      activeLeadership.schoolClassId === schoolClassId &&
      activeLeadership.classLeaderStudentId === user.id
    );
  }
  return false;
}

/**
 * Helper to verify whether user is a teacher of PPLG department.
 */
export function isPplgTeacher(user) {
  if (!user) return false;
  const userRole = (user.role || "").toString().toLowerCase();
  const position = (user.position || "").toString().toLowerCase();
  return userRole === "teacher" && (position.includes("pengembangan perangkat lunak dan gim") || position.includes("pplg"));
}

/**
 * Helper to verify whether user is an Admin or PPLG Teacher.
 */
export function isAdminOrPplgTeacher(user, role) {
  const userRole = (role || user?.role || "").toString().toLowerCase();
  if (userRole === "admin") return true;
  return isPplgTeacher(user);
}
