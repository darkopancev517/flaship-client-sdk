import * as cookie from "./lib/cookie"
import * as jwt from "../jwt"
import { ClientOptions, InternalOptions, RequestInternal } from "./types"
import { parseUrl, parseClientUrl } from "../utils/parse-url"
import { createSecret } from "./lib/utils"
import { createCSRFToken } from "./lib/csrf-token"
import { createAuthToken } from "./lib/auth-token"

export async function init({
  req,
  clientOptions,
}: {
  req: RequestInternal
  clientOptions: ClientOptions
}): Promise<{
  options: InternalOptions
  cookies: cookie.Cookie[]
}> {
  const { origin, endpoint, method, cookies: reqCookies } = req

  const isPost = method === "POST"
  const reqCsrfToken = req.body?.csrfToken

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
