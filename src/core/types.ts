import type { SerializeOptions } from "cookie"

import type { JWTOptions } from "../jwt"
import type { InternalUrl } from "../utils/parse-url"

export type Awaitable<T> = T | PromiseLike<T>

export interface CookieOption {
  name: string
  options: SerializeOptions
}

export interface CookiesOptions {
  sessionToken: CookieOption
  csrfToken: CookieOption
}

export interface SessionOptions {
  /**
   * Relative time from now in seconds when to expire the session
   * @default 2592000 // 30 days
   */
  maxAge: number

  /**
   * How often the session should be updated in seconds.
   * If set to `0`, session is updated every time.
   * @default 86400 // 1 day
   */
  updateAge: number

  /**
   * Generate a custom session token for database-based sessions.
   * By default, a random UUID or string is generated depending on the Node.js version.
   * However, you can specify your own custom string (such as CUID) to be used.
   * @default `randomUUID` or `randomBytes.toHex` depending on the Node.js version
   */
  generateSessionToken: () => Awaitable<string>
}

export interface CallbacksOptions {
  redirect: (params: {
    /** URL provided as callback URL by the client */
    url: string
    /** Default base URL of site (can be used as fallback) */
    baseUrl: string
  }) => Awaitable<string>
}

export interface ClientOptions {
  clientUrl: string
  clientApiKey: string
  clientId: string
  clientPassword: string

  session?: Partial<SessionOptions>
  jwt?: Partial<JWTOptions>
  useSecureCookies?: boolean
  cookies?: Partial<CookiesOptions>
  callbacks?: Partial<CallbacksOptions>
}

export type ClientAction = "csrf"

export interface InternalOptions {
  url: InternalUrl
  action: ClientAction
  csrfToken?: string
  csrfTokenVerified?: boolean
  secret: string
  session: Required<SessionOptions>
  jwt: JWTOptions
  cookies: CookiesOptions
  callbacks: CallbacksOptions
}
