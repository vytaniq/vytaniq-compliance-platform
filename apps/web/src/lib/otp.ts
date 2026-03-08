// apps/web/src/lib/otp.ts
// One-Time Password generation and verification
// 6-digit OTP with configurable expiry (default: 10 minutes)

import crypto from 'crypto'
import { hashPassword, verifyPassword } from './hash'

const OTP_LENGTH = 6
const OTP_EXPIRES_MINUTES = parseInt(process.env.OTP_EXPIRES_MINUTES || '10', 10)

/**
 * Generate a random 6-digit OTP
 */
export function generateOTP(): string {
  const min = Math.pow(10, OTP_LENGTH - 1)
  const max = Math.pow(10, OTP_LENGTH) - 1
  const randomNumber = crypto.randomInt(min, max + 1)
  return randomNumber.toString().padStart(OTP_LENGTH, '0')
}

/**
 * Create OTP record with hashed code and expiry timestamp
 * Hash the OTP before storing (never store plain text)
 */
export async function createOTPRecord(otp: string): Promise<{ hashedOtp: string; expiresAt: Date }> {
  const hashedOtp = await hashPassword(otp)
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000)

  return {
    hashedOtp,
    expiresAt,
  }
}

/**
 * Verify OTP against stored hash with timing-safe comparison
 * Returns { valid: boolean, expired: boolean }
 */
export async function verifyOTP(
  providedOTP: string,
  storedHash: string,
  expiresAt: Date
): Promise<{ valid: boolean; expired: boolean }> {
  const now = new Date()
  const expired = now > expiresAt

  if (expired) {
    return { valid: false, expired: true }
  }

  try {
    const valid = await verifyPassword(providedOTP, storedHash)
    return { valid, expired: false }
  } catch {
    return { valid: false, expired: false }
  }
}
