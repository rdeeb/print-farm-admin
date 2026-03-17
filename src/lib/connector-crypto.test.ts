import { encryptCredentials, decryptCredentials, hasEncryptionKey } from './connector-crypto'

const VALID_KEY = 'a'.repeat(64) // 32-byte hex string (all 'aa' bytes)

describe('connector-crypto', () => {
  beforeEach(() => {
    process.env.CONNECTOR_ENCRYPTION_KEY = VALID_KEY
  })

  afterEach(() => {
    delete process.env.CONNECTOR_ENCRYPTION_KEY
  })

  describe('encryptCredentials / decryptCredentials', () => {
    it('round-trip: encrypt then decrypt returns the same object', () => {
      const plaintext = { serial: 'ABC123', accessCode: 'secret-pass', userId: 'user-001' }
      const encrypted = encryptCredentials(plaintext)
      const decrypted = decryptCredentials(encrypted)
      expect(decrypted).toEqual(plaintext)
    })

    it('round-trip works with nested objects', () => {
      const plaintext = { token: 'tok_123', meta: { region: 'us-east', port: 8080 } }
      const encrypted = encryptCredentials(plaintext)
      const decrypted = decryptCredentials(encrypted)
      expect(decrypted).toEqual(plaintext)
    })

    it('produces different IVs for the same plaintext (non-deterministic)', () => {
      const plaintext = { key: 'value' }
      const enc1 = encryptCredentials(plaintext)
      const enc2 = encryptCredentials(plaintext)
      expect(enc1.iv).not.toBe(enc2.iv)
    })

    it('produces different ciphertexts for the same plaintext due to random IV', () => {
      const plaintext = { key: 'value' }
      const enc1 = encryptCredentials(plaintext)
      const enc2 = encryptCredentials(plaintext)
      expect(enc1.ciphertext).not.toBe(enc2.ciphertext)
    })

    it('returns an object with ciphertext, iv, and tag fields', () => {
      const encrypted = encryptCredentials({ foo: 'bar' })
      expect(encrypted).toHaveProperty('ciphertext')
      expect(encrypted).toHaveProperty('iv')
      expect(encrypted).toHaveProperty('tag')
      expect(typeof encrypted.ciphertext).toBe('string')
      expect(typeof encrypted.iv).toBe('string')
      expect(typeof encrypted.tag).toBe('string')
    })

    it('decryption with a wrong key throws', () => {
      const plaintext = { secret: 'value' }
      const encrypted = encryptCredentials(plaintext)

      // Switch to a different key
      process.env.CONNECTOR_ENCRYPTION_KEY = 'b'.repeat(64)

      expect(() => decryptCredentials(encrypted)).toThrow()
    })

    it('decryption with tampered ciphertext throws', () => {
      const plaintext = { secret: 'tamper-test' }
      const encrypted = encryptCredentials(plaintext)

      // Flip one byte in the ciphertext
      const ciphertextBuf = Buffer.from(encrypted.ciphertext, 'base64')
      ciphertextBuf[0] ^= 0xff
      const tampered = { ...encrypted, ciphertext: ciphertextBuf.toString('base64') }

      expect(() => decryptCredentials(tampered)).toThrow()
    })

    it('throws when CONNECTOR_ENCRYPTION_KEY is not set', () => {
      delete process.env.CONNECTOR_ENCRYPTION_KEY
      expect(() => encryptCredentials({ foo: 'bar' })).toThrow(
        /CONNECTOR_ENCRYPTION_KEY/
      )
    })

    it('throws when CONNECTOR_ENCRYPTION_KEY is not a valid 32-byte hex string', () => {
      process.env.CONNECTOR_ENCRYPTION_KEY = 'tooshort'
      expect(() => encryptCredentials({ foo: 'bar' })).toThrow()
    })
  })

  describe('hasEncryptionKey', () => {
    it('returns true when a valid key is set', () => {
      process.env.CONNECTOR_ENCRYPTION_KEY = VALID_KEY
      expect(hasEncryptionKey()).toBe(true)
    })

    it('returns false when env var is not set', () => {
      delete process.env.CONNECTOR_ENCRYPTION_KEY
      expect(hasEncryptionKey()).toBe(false)
    })

    it('returns false when env var is an empty string', () => {
      process.env.CONNECTOR_ENCRYPTION_KEY = ''
      expect(hasEncryptionKey()).toBe(false)
    })

    it('returns false when env var is not a valid 32-byte hex string', () => {
      process.env.CONNECTOR_ENCRYPTION_KEY = 'not-hex-at-all'
      expect(hasEncryptionKey()).toBe(false)
    })
  })
})
