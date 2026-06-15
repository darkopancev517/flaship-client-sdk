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

  clientAuthVerificationToken: CookieOption
  clientSessionToken: CookieOption
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

export type ClientEndpoint = "csrf" | "status" | "auth"

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
