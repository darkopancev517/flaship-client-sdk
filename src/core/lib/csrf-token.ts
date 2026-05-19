import { createHash, randomBytes } from "crypto"

import type { InternalOptions } from "../types"

interface CreateCSRFTokenParams {
  options: InternalOptions
  cookieValue?: string
  isPost: boolean
  bodyValue?: string
}

export function createCSRFToken({
  options,
  cookieValue,
  isPost,
  bodyValue,
}: CreateCSRFTokenParams) {
  if (cookieValue) {
    const [csrfToken, csrfTokenHash] = cookieValue.split("|")

    const expectedCsrfTokenHash = createHash("sha256")
      .update(`${csrfToken}${options.secret}`)
      .digest("hex")

    if (csrfTokenHash === expectedCsrfTokenHash) {
      // If hash matches then we trust the CSRF token value
      // If this is a POST request and the CSRF Token in the POST request matches
      // the cookie we have already verified is the one we have set, then the token is verified!
      const csrfTokenVerified = isPost && csrfToken === bodyValue

      return { csrfTokenVerified, csrfToken }
    }
  }

  // New CSRF token
  const csrfToken = randomBytes(32).toString("hex")
  const csrfTokenHash = createHash("sha256")
    .update(`${csrfToken}${options.secret}`)
    .digest("hex")
  const cookie = `${csrfToken}|${csrfTokenHash}`

  return { cookie, csrfToken }
}
