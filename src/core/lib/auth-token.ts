import { createHash } from "crypto"

import { InternalOptions } from "../types"

export async function createAuthToken(options: InternalOptions) {
  const { clientId, clientApiKey, clientSecret, jwt } = options

  const token = await jwt.encode({
    token: { secret: clientSecret },
    maxAge: 15 * 60,
    secret: clientApiKey,
  })

  const tokenHash = createHash("sha256")
    .update(`${token}${clientApiKey}`)
    .digest("hex")

  const authToken = `${clientId}|${token}|${tokenHash}`

  return { authToken }
}
