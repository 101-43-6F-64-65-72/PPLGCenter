import { z } from "zod";

/**
 * Zod validation schema for Login form
 */
export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, { message: "NIS / NISN / NIP wajib diisi" })
    .min(4, { message: "NIS / NISN / NIP minimal 4 karakter" }),
  password: z
    .string()
    .min(1, { message: "Password wajib diisi" })
    .min(6, { message: "Password minimal 6 karakter" }),
});

export default loginSchema;
