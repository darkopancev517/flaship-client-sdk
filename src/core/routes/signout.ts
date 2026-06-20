import { SessionStore } from "../lib/cookie"
import { InternalOptions, ResponseInternal } from "../types"

export default async function signout(params: {
  options: InternalOptions
  sessionStore: SessionStore
}): Promise<ResponseInternal> {
  const { options, sessionStore } = params

  const sessionToken = sessionStore?.value
  if (!sessionToken) {
    return { redirect: options.url.origin }
  }

  // Remove Session Token
  const sessionCookies = sessionStore.clean()

  return { redirect: options.url.origin, cookies: sessionCookies }
}
