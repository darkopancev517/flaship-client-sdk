export interface APIResponse<T> {
  success: boolean
  data: T
  timestamp: string
}

export interface ClientStatus {
  status: "up" | "down"
  version: string
  description: string
}
