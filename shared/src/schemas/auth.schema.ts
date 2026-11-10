import { z } from "zod";

export const RegisterSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(80),
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  targetRole: z.string().trim().min(2).max(100).optional().default("Full Stack Software Engineer"),
  yearsExperience: z.number().int().min(0).max(50).optional().default(0),
});

export const LoginSchema = z.object({
  email: z.string().trim().email("Valid email is required").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
