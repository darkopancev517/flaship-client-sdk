import { EncryptJWT, jwtDecrypt } from "jose"
import hkdf from "@panva/hkdf"
import { v4 as uuid } from "uuid"

import type { JWT, JWTEncodeParams, JWTDecodeParams } from "./types"

export * from "./types"

const DEFAULT_MAX_AGE = 30 * 24 * 60 * 60 // 30 days

const now = () => (Date.now() / 1000) | 0

// Issues a JWT. By default, the JWT is encrypted using "A256GCM"
export async function encode(params: JWTEncodeParams) {
  // Note: empty salt means a session token.
  const { token = {}, secret, maxAge = DEFAULT_MAX_AGE, salt = "" } = params
  const encryptionSecret = await getDerivedEncryptionKey(secret, salt)
  return await new EncryptJWT(token)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(now() + maxAge)
    .setJti(uuid())
    .encrypt(encryptionSecret)
}

// Decodes a FlashipClient issued JWT
export async function decode(params: JWTDecodeParams): Promise<JWT | null> {
  // Note: empty salt means a session token.
  const { token, secret, salt = "" } = params
  if (!token) return null
  const encryptionSecret = await getDerivedEncryptionKey(secret, salt)
  const { payload } = await jwtDecrypt(token, encryptionSecret, {
    clockTolerance: 15,
  })
  return payload
}

async function getDerivedEncryptionKey(
  keyMaterial: string | Buffer,
  salt: string
) {
  return await hkdf(
    "sha256",
    keyMaterial,
    salt,
    `NextAuth.js Generated Encryption Key${salt ? ` (${salt})` : ""}`,
    32
  )
}
