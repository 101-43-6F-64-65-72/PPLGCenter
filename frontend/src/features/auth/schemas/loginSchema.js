import { z } from "zod";

/**
 * Zod validation schema for Login form
 */
export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, { message: "ID Akun (NIS/NISN/NIP/Email) wajib diisi" }),
  password: z
    .string()
    .min(1, { message: "Password wajib diisi" }),
});

export default loginSchema;
