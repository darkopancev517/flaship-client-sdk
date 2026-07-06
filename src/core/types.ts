import type { SerializeOptions } from "cookie"

import type { Cookie } from "./lib/cookie"
import type { JWTOptions } from "../jwt"
import type { InternalUrl } from "../utils/parse-url"

export type Awaitable<T> = T | PromiseLike<T>

export interface CookieOption {
  name: string
  options: SerializeOptions
}

export interface CookiesOptions {
  csrfToken: CookieOption

  clientVerificationToken: CookieOption
  clientSessionToken: CookieOption
  clientResetPasswordToken: CookieOption
  clientPkceCodeVerifier: CookieOption
  clientState: CookieOption
  clientNonce: CookieOption
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

export type ClientEndpoint = "csrf" | "status" | "auth" | "session" | "signout"
export type ClientAction = "register" | "confirm" | "signin" | "resetpassword" | "callback"

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

export interface RequestInternal {
  origin?: string
  method?: string
  cookies?: Partial<Record<string, string>>
  headers?: Record<string, any>
  query?: Record<string, any>
  body?: Record<string, any>
  endpoint: ClientEndpoint
  action?: ClientAction
  providerId?: string
}

export interface ClientHeader {
  key: string
  value: string
}

export interface ResponseInternal<
  Body extends string | Record<string, any> | any[] = any,
> {
  status?: number
  headers?: ClientHeader[]
  body?: Body
  redirect?: string
  cookies?: Cookie[]
}

export interface RouteParams {
  req: RequestInternal
  options: InternalOptions
}

export interface Session {
  user?: {
    id?: string | null
    name?: string | null
    email?: string | null
    image?: string | null
    provider?: string | null
  }
  expires: number // Unix Timestamp
}
