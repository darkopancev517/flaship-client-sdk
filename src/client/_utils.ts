import type { IncomingMessage } from "http"

export interface ClientConfig {
  baseUrl: string
  basePath: string
}

export interface CtxOrReq {
  req?: Partial<IncomingMessage> & { body?: any }
  ctx?: { req: Partial<IncomingMessage> & { body?: any } }
}

export function apiBaseUrl(__CLIENT: ClientConfig) {
  if (typeof window === "undefined") {
    // Return absolute path when called server side
    return `${__CLIENT.baseUrl}${__CLIENT.basePath}`
  }
  // Return relative path when called client side
  return __CLIENT.basePath
}

export async function fetchData<T = any>(
  path: string,
  __CLIENT: ClientConfig,
  { ctx, req = ctx?.req }: CtxOrReq = {}
): Promise<T | null> {
  const url = `${apiBaseUrl(__CLIENT)}/${path}`
  try {
    const options: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(req?.headers?.cookie ? { cookie: req.headers.cookie } : {}),
      },
    }

    if (req?.body) {
      options.body = JSON.stringify(req.body)
      options.method = "POST"
    }

    const res = await fetch(url, options)
    const data = await res.json()
    if (!res.ok) throw data
    return Object.keys(data).length > 0 ? data : null // Return null if data empty
  } catch (error) {
    console.error("CLIENT_FETCH_ERROR", { error: error as Error, url })
    return null
  }
}
