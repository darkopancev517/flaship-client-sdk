import jwt, { Secret, JwtPayload } from "jsonwebtoken"

import { ClientConfig, APIResponse, HealthStatus } from "./types"
import { SDKError, handleAPIError, handleNetworkError } from "./errors"

export class FlashipClient {
  private config: ClientConfig

  constructor(config: ClientConfig) {
    if (!config.baseUrl) {
      throw new SDKError(
        "Base URL is required",
        "CONFIGURATION_ERROR",
        "Please provide baseURL in SDK constructor"
      )
    }

    if (!config.clientId) {
      throw new SDKError(
        "Client ID is required",
        "CONFIGURATION_ERROR",
        "Please provide client ID in SDK constructor"
      )
    }

    if (!config.apiKey) {
      throw new SDKError(
        "API key is required",
        "CONFIGURATION_ERROR",
        "Please provide API key in SDK constructor"
      )
    }

    if (!config.password) {
      throw new SDKError(
        "Password is required",
        "CONFIGURATION_ERROR",
        "Please provide password in SDK constructor"
      )
    }

    this.config = {
      timeout: 30000, // Default 30 second timeout
      ...config,
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      )

      // Create authorization token
      const authPayload: JwtPayload = {
        clientId: this.config.clientId,
        password: this.config.password,
      }

      const token = jwt.sign(authPayload, this.config.apiKey as Secret)

      const response = await fetch(url, {
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
        handleAPIError(response, data)
      }

      return data as T
    } catch (error) {
      if (error instanceof SDKError) {
        throw error
      }

      handleNetworkError(error as Error)
    }
  }

  async getHealth(): Promise<APIResponse<HealthStatus>> {
    return this.request<APIResponse<HealthStatus>>("/health")
  }
}
