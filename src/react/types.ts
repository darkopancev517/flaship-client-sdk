export type Params =
  | string
  | string[][]
  | Record<string, string>
  | URLSearchParams

export interface ClientResponse {
  error: string
  status: number
  ok: boolean
  url: string | null
}

export interface SignOutResponse {
  url: string
}

export interface SignOutParams<R extends boolean = true> {
  callbackUrl?: string
  redirect?: R
}
