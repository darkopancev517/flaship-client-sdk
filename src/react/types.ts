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

export type AuthAction =
  | "register"
  | "confirm"
  | "signin"
  | "signout"
  | "resetpassword"
