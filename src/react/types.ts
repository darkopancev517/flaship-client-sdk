export type Params =
  | string
  | string[][]
  | Record<string, string>
  | URLSearchParams

export interface ServerResponse {
  error: string
  status: number
  ok: boolean
  url: string | null
}
