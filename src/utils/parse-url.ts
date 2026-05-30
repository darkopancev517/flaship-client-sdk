export interface InternalUrl {
  /** @default "http://localhost:3000" */
  origin: string
  /** @default "localhost:3000" */
  host: string
  /** @default "/api/client" */
  path: string
  /** @default "http://localhost:3000/api/client" */
  base: string
  /** @default "http://localhost:3000/api/client" */
  toString: () => string
}

export function parseUrl(url?: string): InternalUrl {
  const defaultUrl = new URL("http://localhost:3000/api/client")

  if (url && !url.startsWith("http")) {
    url = `https://${url}`
  }

  const _url = new URL(url ?? defaultUrl)
  const path = (_url.pathname === "/" ? defaultUrl.pathname : _url.pathname)
    // Remove trailing slash
    .replace(/\/$/, "")

  const base = `${_url.origin}${path}`

  return {
    origin: _url.origin,
    host: _url.host,
    path,
    base,
    toString: () => base,
  }
}

export function parseClientUrl(url: string): {
  userId: string
  url: InternalUrl
} {
  const trimmedUrl = url.trim()

  if (!trimmedUrl.match(/^https?:\/\//i)) {
    throw new Error("parseClientUrl: Must be a valid HTTP or HTTPS URL.")
  }

  const splittedUrl = trimmedUrl.split("//")

  if (
    splittedUrl[1].includes("localhost") &&
    splittedUrl[1].split(".").length !== 2
  ) {
    throw new Error(
      "parseClientUrl: Provided localhost URL subdomain is malformed."
    )
  }

  if (
    !splittedUrl[1].includes("localhost") &&
    splittedUrl[1].split(".").length !== 3
  ) {
    throw new Error("parseClientUrl: Provided URL subdomain is malformed.")
  }

  const userId = splittedUrl[1].split(".")[0]
  const protocol = trimmedUrl.split("//")[0]
  const domainName = trimmedUrl.split("//")[1].split(".")[1]
  const isLocalhost = domainName.includes("localhost")
  const extension = !isLocalhost ? splittedUrl[1].split(".")[2] : ""

  if (!isLocalhost && (domainName !== "flaship" || extension !== "io")) {
    throw new Error("Invalid clientUrl domain.")
  }

  const domain = isLocalhost ? domainName : `${domainName}.${extension}`
  const baseUrl = `${protocol}//${domain}/api/client`

  const _url = new URL(baseUrl)
  const path = _url.pathname.replace(/\/$/, "")

  const base = `${_url.origin}${path}`

  return {
    userId,
    url: {
      origin: _url.origin,
      host: _url.host,
      path,
      base,
      toString: () => base,
    },
  }
}
