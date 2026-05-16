export interface APIResponse<T> {
  success: boolean
  data: T
  timestamp: string
}

export interface HealthStatus {
  connection: boolean
  version: string
  latency_ms: number
  message: string
}
