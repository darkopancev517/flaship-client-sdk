export function ensureTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : url + "/"
}

// valid URL:
// http://abc123.localhost:3000
// https://abc123.flaship.io

export function validateFlashipUrl(flashipUrl: string): URL {
  const trimmedUrl = flashipUrl.trim()

  if (!trimmedUrl) {
    throw new Error("flashipUrl is required.")
  }

  if (!trimmedUrl.match(/^https?:\/\//i)) {
    throw new Error("Invalid flashipUrl: Must be a valid HTTP or HTTPS URL.")
  }

  const splittedUrl = trimmedUrl.split("//")

  if (
    splittedUrl[1].includes("localhost") &&
    splittedUrl[1].split(".").length !== 2
  ) {
    throw new Error(
      "Invalid flashipUrl: Provided localhost URL subdomain is malformed."
    )
  }

  if (
    !splittedUrl[1].includes("localhost") &&
    splittedUrl[1].split(".").length !== 3
  ) {
    throw new Error("Invalid flashipUrl: Provided URL subdomain is malformed.")
  }

  const userId = splittedUrl[1].split(".")[0]
  const protocol = trimmedUrl.split("//")[0]
  const domainName = trimmedUrl.split("//")[1].split(".")[1]
  const isLocalhost = domainName.includes("localhost")
  const extension = !isLocalhost ? splittedUrl[1].split(".")[2] : ""

  if (!isLocalhost && (domainName !== "flaship" || extension !== "io")) {
    throw new Error("Invalid flashipUrl domain.")
  }

  const domain = isLocalhost ? domainName : `${domainName}.${extension}`
  const baseUrl = `${protocol}//${domain}/api/client/${userId}`

  try {
    return new URL(ensureTrailingSlash(baseUrl))
  } catch {
    throw new Error("Invalid flashipUrl: Provided URL is malformed.")
  }
}

export function handleAPIError(response: Response): never {
  if (response.status === 401) {
    throw new Error("Authentication error invalid or missing API key.")
  }

  if (response.status === 404) {
    throw new Error("Resource not found.")
  }

  if (response.status === 400) {
    throw new Error("Bad request.")
  }

  if (response.status === 429) {
    throw new Error("Too many requests rate limit exceeded.")
  }

  if (response.status >= 500) {
    throw new Error("Internal server error.")
  }

  throw new Error(`HTTP ERROR ${response.status}: ${response.statusText}.`)
}

export function handleRequestError(error: Error): never {
  if (error.name === "AbortError" || error.message.includes("timeout")) {
    throw new Error("Request timed out.")
  }

  if (error.message.includes("fetch")) {
    throw new Error("Network connection failed.")
  }

  throw new Error(`Unknown error occurred: ${error.message}.`)
}
