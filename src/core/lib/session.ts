import { createHash } from "crypto"

import type { InternalOptions } from "../types"
import type { Cookie } from "./cookie"

export async function parseClientSession(params: {
  options: InternalOptions
  sessionCookie: Cookie
}): Promise<{ cookies: Cookie[] }> {
  const { options, sessionCookie } = params
  const cookies: Cookie[] = []

  const sessionCookieValue = sessionCookie.value

  const [clientId, sessionToken, sessionTokenHash] =
    sessionCookieValue.split("|")

  if (options.clientId !== clientId) {
    throw new Error("Invalid session client ID")
  }

  const expectedSessionTokenHash = createHash("sha256")
    .update(`${sessionToken}${options.clientApiKey}`)
    .digest("hex")

  if (expectedSessionTokenHash !== sessionTokenHash) {
    throw new Error("Invalid session token")
  }

  cookies.push({
    name: options.cookies.clientSessionToken.name,
    value: sessionToken,
    options: options.cookies.clientSessionToken.options,
  })

  return { cookies }
}
