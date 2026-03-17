import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16

function getKey(): Buffer {
  const hex = process.env.CONNECTOR_ENCRYPTION_KEY
  if (!hex) {
    throw new Error(
      'CONNECTOR_ENCRYPTION_KEY environment variable is not set. ' +
        'Provide a 32-byte (64-character) hex string.'
    )
  }
  const buf = Buffer.from(hex, 'hex')
  if (buf.length !== 32) {
    throw new Error(
      'CONNECTOR_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).'
    )
  }
  return buf
}

export interface EncryptedCredentials {
  ciphertext: string
  iv: string
  tag: string
}

/**
 * Encrypts a credentials object using AES-256-GCM.
 * Returns a JSON-serializable object containing base64-encoded ciphertext, IV, and auth tag.
 */
export function encryptCredentials(plaintext: object): EncryptedCredentials {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const json = JSON.stringify(plaintext)
  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  }
}

/**
 * Decrypts credentials that were encrypted with `encryptCredentials`.
 * Throws if the key is wrong or the data has been tampered with.
 */
export function decryptCredentials<T = Record<string, unknown>>(encrypted: EncryptedCredentials): T {
  const key = getKey()
  const iv = Buffer.from(encrypted.iv, 'base64')
  const tag = Buffer.from(encrypted.tag, 'base64')
  const ciphertext = Buffer.from(encrypted.ciphertext, 'base64')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return JSON.parse(decrypted.toString('utf8')) as T
}

/**
 * Returns true if CONNECTOR_ENCRYPTION_KEY is set and appears to be a valid 32-byte hex string.
 * Useful for health checks — does NOT expose the key.
 */
export function hasEncryptionKey(): boolean {
  const hex = process.env.CONNECTOR_ENCRYPTION_KEY
  if (!hex) return false
  return Buffer.from(hex, 'hex').length === 32
}
