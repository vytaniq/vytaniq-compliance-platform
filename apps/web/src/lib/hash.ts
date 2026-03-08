// apps/web/src/lib/hash.ts
// Password hashing and verification using bcrypt
// Follows OWASP recommendations: minimum 12 rounds

import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

/**
 * Hash a plain-text password using bcrypt
 * OWASP recommendation: 12+ rounds
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS)
  } catch (error) {
    throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Compare a plain-text password with a hash
 * Uses constant-time comparison to prevent timing attacks
 */
export async function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hash)
  } catch (error) {
    throw new Error(`Password verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
