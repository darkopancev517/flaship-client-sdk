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
