import type { IncomingMessage } from "http"

export interface ServerConfig {
  baseUrl: string
  basePath: string
}

export interface CtxOrReq {
  req?: Partial<IncomingMessage> & { body?: any }
  ctx?: { req: Partial<IncomingMessage> & { body?: any } }
}

export function apiBaseUrl(__SERVER: ServerConfig) {
  if (typeof window === "undefined") {
    // Return absolute path when called server side
    return `${__SERVER.baseUrl}${__SERVER.basePath}`
  }
  // Return relative path when called client side
  return __SERVER.basePath
}

export async function fetchData<T = any>(
  path: string,
  __SERVER: ServerConfig,
  { ctx, req = ctx?.req }: CtxOrReq = {}
): Promise<T | null> {
  const url = `${apiBaseUrl(__SERVER)}/${path}`
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

    if (!res.ok) {
      throw new Error(data.error)
    }

    return Object.keys(data).length > 0 ? data : null // Return null if data empty
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message)
    }

    throw new Error("An unexpected error occurred")
  }
}
