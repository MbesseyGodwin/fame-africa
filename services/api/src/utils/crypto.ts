import * as crypto from 'crypto'

export function hashValue(value: string): string {
  return crypto
    .createHmac('sha256', process.env.ENCRYPTION_KEY || 'fallback-key')
    .update(value.toLowerCase().trim())
    .digest('hex')
}

export function generateOtp(length = 6): string {
  const digits = '0123456789'
  let otp = ''
  const bytes = crypto.randomBytes(length)
  for (let i = 0; i < length; i++) {
    otp += digits[bytes[i] % 10]
  }
  return otp
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}
