import * as cookie from "./lib/cookie"
import * as jwt from "../jwt"
import { ClientOptions, InternalOptions } from "./types"
import { RequestInternal } from "."
import { parseUrl, parseClientUrl } from "../utils/parse-url"
import { createSecret } from "./lib/utils"
import { createCSRFToken } from "./lib/csrf-token"
import { createAuthToken } from "./lib/auth-token"

interface InitParams {
  origin?: string
  clientOptions: ClientOptions
  endpoint: InternalOptions["endpoint"]
  /** CSRF token value extracted from the incoming request. From body if POST, from query if GET */
  csrfToken?: string
  /** Is the incoming request a POST request? */
  isPost: boolean
  cookies: RequestInternal["cookies"]
}

export async function init({
  clientOptions,
  endpoint,
  origin,
  cookies: reqCookies,
  csrfToken: reqCsrfToken,
  isPost,
}: InitParams): Promise<{
  options: InternalOptions
  cookies: cookie.Cookie[]
}> {
  const url = parseUrl(origin)

  const secret = createSecret({ clientOptions, url })

  const maxAge = 30 * 24 * 60 * 60 // Sessions expire after 30 days of being idle by default

  const { clientUrl, clientId, clientApiKey, clientSecret } = clientOptions
  const { userId, url: serverUrl } = parseClientUrl(clientUrl)

  const options: InternalOptions = {
    url,
    endpoint,
    userId,
    clientId,
    clientApiKey,
    clientSecret,
    serverUrl,
    secret,
    jwt: {
      secret,
      maxAge,
      encode: jwt.encode,
      decode: jwt.decode,
      ...clientOptions.jwt,
    },
    cookies: {
      ...cookie.defaultCookies(
        clientOptions.useSecureCookies ?? url.base.startsWith("https://")
      ),
      // Allow user cookie options to override any cookie settings above
      ...clientOptions.cookies,
    },
  }

  // Init cookies

  const cookies: cookie.Cookie[] = []

  const {
    csrfToken,
    cookie: csrfCookie,
    csrfTokenVerified,
  } = createCSRFToken({
    options,
    cookieValue: reqCookies?.[options.cookies.csrfToken.name],
    isPost,
    bodyValue: reqCsrfToken,
  })

  options.csrfToken = csrfToken
  options.csrfTokenVerified = csrfTokenVerified

  if (csrfCookie) {
    cookies.push({
      name: options.cookies.csrfToken.name,
      value: csrfCookie,
      options: options.cookies.csrfToken.options,
    })
  }

  // Create server authorization token
  const { authToken } = await createAuthToken(options)
  options.serverAuthToken = authToken

  return { options, cookies }
}
