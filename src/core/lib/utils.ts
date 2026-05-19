import { createHash } from "crypto"

import type { InternalOptions, ClientOptions } from "../types"
import type { InternalUrl } from "../../utils/parse-url"

/**
 * Takes a number in seconds and returns the date in the future.
 * Optionally takes a second date parameter. In that case
 * the date in the future will be calculated from that date instead of now.
 */
export function fromDate(time: number, date = Date.now()) {
  return new Date(date + time * 1000)
}

export function hashToken(token: string, options: InternalOptions) {
  const { secret } = options

  return createHash("sha256").update(`${token}${secret}`).digest("hex")
}

/**
 * Secret used salt cookies and tokens (e.g. for CSRF protection).
 * If no secret option is specified then it creates one on the fly
 * based on options passed here. If options contains unique data,
 * it should be sufficent.
 */
export function createSecret(params: {
  clientOptions: ClientOptions
  url: InternalUrl
}) {
  const { clientOptions, url } = params

  return createHash("sha256")
    .update(JSON.stringify({ ...url, ...clientOptions }))
    .digest("hex")
}
