import jwt, { Secret, JwtPayload } from "jsonwebtoken"

import { APIResponse, ClientStatus } from "./types"
import {
  validateFlashipUrl,
  handleAPIError,
  handleRequestError,
} from "./helpers"

export class FlashipClient {
  private baseUrl: URL
  private authUrl: URL
  private imageUrl: URL
  private projectId: string
  private apiKey: string
  private password: string
  private timeout?: number

  constructor(
    protected flashipUrl: string,
    protected flashipProjectId: string,
    protected flashipApiKey: string,
    protected flashipPassword: string,
    timeout?: number
  ) {
    const baseUrl = validateFlashipUrl(flashipUrl)
    if (!flashipProjectId) throw new Error("flashipProjectId is required.")
    if (!flashipApiKey) throw new Error("flashipApiKey is required.")
    if (!flashipPassword) throw new Error("flashipPassword is required.")

    this.baseUrl = baseUrl
    this.authUrl = new URL('auth/v1', baseUrl)
    this.imageUrl = new URL('image/v1', baseUrl)
    this.projectId = flashipProjectId
    this.apiKey = flashipApiKey
    this.password = flashipPassword
    this.timeout = timeout ?? 30000 // Default 30 seconds timeout
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = new URL(endpoint, this.baseUrl)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      // Create authorization token
      const authPayload: JwtPayload = {
        projectId: this.projectId,
        password: this.password,
      }

      const token = jwt.sign(authPayload, this.apiKey as Secret)

      const response = await fetch(url.href, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      let data
      try {
        data = await response.json()
      } catch {
        data = null
      }

      if (!response.ok) {
        handleAPIError(response)
      }

      return data as T
    } catch (error) {
      if (error instanceof Error) {
        handleRequestError(error)
      }

      throw new Error("An unexpected request error occurred.")
    }
  }

  async getStatus(): Promise<APIResponse<ClientStatus>> {
    const params = new URLSearchParams({
      item: "status",
    })

    return this.request<APIResponse<ClientStatus>>(`data?${params}`)
  }
}
