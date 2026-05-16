export class SDKError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: string,
    public status?: number,
    public originalError?: Error
  ) {
    super(message)
    this.name = "SDKError"
  }
}

export function handleAPIError(response: Response, data?: any): never {
  if (response.status === 401) {
    throw new SDKError(
      "Invalid or missing API key",
      "AUTHENTICATION_ERROR",
      "Check your API key configuration",
      401
    )
  }

  if (response.status === 404) {
    throw new SDKError(
      "Resource not found",
      "NOT_FOUND",
      data?.error?.message || "The requested resource was not found",
      404
    )
  }

  if (response.status === 400) {
    throw new SDKError(
      "Bad request",
      "VALIDATION_ERROR",
      data?.error?.message || "Invalid request data",
      400
    )
  }

  if (response.status === 429) {
    throw new SDKError(
      "Rate limit exceeded",
      "RATE_LIMIT_ERROR",
      "Too many requests. Please try again later",
      429
    )
  }

  if (response.status >= 500) {
    throw new SDKError(
      "Internal server error",
      "SERVER_ERROR",
      "The API service is temporarily unavailable",
      response.status
    )
  }

  throw new SDKError(
    `HTTP ${response.status}: ${response.statusText}`,
    `HTTP_ERROR`,
    data?.error?.message || "Unknown API error",
    response.status
  )
}

export function handleNetworkError(error: Error): never {
  if (error.name === "AbortError" || error.message.includes("timeout")) {
    throw new SDKError(
      "Request timed out",
      "TIMEOUT_ERROR",
      "The request took too long to complete",
      undefined,
      error
    )
  }

  if (error.message.includes("fetch")) {
    throw new SDKError(
      "Network connection failed",
      "NETWORK_ERROR",
      "Check your internet connection and try again",
      undefined,
      error
    )
  }

  throw new SDKError(
    "Unknown error occurred",
    "UNKNOWN_ERROR",
    error.message,
    undefined,
    error
  )
}
