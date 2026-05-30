import type { SerializeOptions } from "cookie"

import type { JWTOptions } from "../jwt"
import type { InternalUrl } from "../utils/parse-url"

export type Awaitable<T> = T | PromiseLike<T>

export interface CookieOption {
  name: string
  options: SerializeOptions
}

export interface CookiesOptions {
  csrfToken: CookieOption
}

export interface ClientOptions {
  clientUrl: string
  clientApiKey: string
  clientId: string
  clientSecret: string

  jwt?: Partial<JWTOptions>
  useSecureCookies?: boolean
  cookies?: Partial<CookiesOptions>
}

export type ClientEndpoint = "csrf" | "status"

export interface InternalOptions {
  url: InternalUrl
  endpoint: ClientEndpoint
  userId: string
  clientId: string
  clientApiKey: string
  clientSecret: string
  serverUrl: InternalUrl
  serverAuthToken?: string
  csrfToken?: string
  csrfTokenVerified?: boolean
  secret: string
  jwt: JWTOptions
  cookies: CookiesOptions
}
