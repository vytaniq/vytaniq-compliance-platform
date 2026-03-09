// apps/web/src/validators/auth.ts
// Zod validation schemas for authentication endpoints
// All inputs validated before hitting database

import { z } from 'zod'

// Email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Password requirements: minimum 8 characters
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/

/**
 * Registration schema
 * Validates: email, password strength, company name
 */
export const registerSchema = z
  .object({
    email: z
      .string()
      .email('Invalid email address')
      .max(255)
      .transform((e) => e.toLowerCase()),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        PASSWORD_REGEX,
        'Password must contain uppercase, lowercase, and numbers'
      ),
    confirmPassword: z.string(),
    companyName: z
      .string()
      .min(2, 'Company name required')
      .max(255),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type RegisterInput = z.infer<typeof registerSchema>

/**
 * Login schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(255)
    .transform((e) => e.toLowerCase()),
  password: z.string().min(1, 'Password required'),
})

export type LoginInput = z.infer<typeof loginSchema>

/**
 * OTP verification schema
 */
export const verifyOTPSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(255)
    .transform((e) => e.toLowerCase()),
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must be numeric'),
})

export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>

/**
 * Refresh token schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
})

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
