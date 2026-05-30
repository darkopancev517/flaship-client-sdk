import { parse as parseCookie } from "cookie"

import * as routes from "./routes"
import type { ClientEndpoint, ClientOptions } from "./types"
import { detectOrigin } from "../utils/detect-origin"
import { init } from "./init"
import type { Cookie } from "./lib/cookie"

export interface RequestInternal {
  origin?: string
  method?: string
  cookies?: Partial<Record<string, string>>
  headers?: Record<string, any>
  query?: Record<string, any>
  body?: Record<string, any>
  endpoint: ClientEndpoint
}

export interface ClientHeader {
  key: string
  value: string
}

export interface ResponseInternal<
  Body extends string | Record<string, any> | any[] = any,
> {
  status?: number
  headers?: ClientHeader[]
  body?: Body
  redirect?: string
  cookies?: Cookie[]
}

export interface ClientHandlerParams {
  req: Request | RequestInternal
  options: ClientOptions
}

async function getBody(req: Request): Promise<Record<string, any> | undefined> {
  try {
    return (await req.json()) as Promise<any>
  } catch { }
}

async function toInternalRequest(
  req: RequestInternal | Request
): Promise<RequestInternal> {
  if (req instanceof Request) {
    const url = new URL(req.url)
    const client = url.pathname.split("/").slice(3)
    const headers = Object.fromEntries(req.headers)
    const query: Record<string, any> = Object.fromEntries(url.searchParams)

    return {
      endpoint: client[0] as ClientEndpoint,
      method: req.method,
      headers,
      body: await getBody(req),
      cookies: parseCookie(req.headers.get("cookie") ?? ""),
      origin: detectOrigin(
        headers["x-forwarded-host"] ?? headers.host,
        headers["x-forwarded-proto"]
      ),
      query,
    }
  }

  const { headers } = req
  const host = headers?.["x-forwarded-host"] ?? headers?.host
  req.origin = detectOrigin(host, headers?.["x-forwarded-proto"])

  return req
}

export async function ClientHandler<
  Body extends string | Record<string, any> | any[],
>(params: ClientHandlerParams): Promise<ResponseInternal<Body>> {
  const { options: clientOptions, req: incomingRequest } = params

  const req = await toInternalRequest(incomingRequest)

  const { endpoint, method = "GET" } = req

  const { options, cookies } = await init({
    clientOptions,
    endpoint,
    origin: req.origin,
    csrfToken: req.body?.csrfToken,
    cookies: req.cookies,
    isPost: method === "POST",
  })

  //const sessionStore = new SessionStore(options.cookies.sessionToken, req)

  if (method === "GET") {
    switch (endpoint) {
      case "csrf": {
        return {
          headers: [
            { key: "Content-Type", value: "application/json" },
            {
              key: "Cache-Control",
              value: "private, no-cache, no-store",
            },
            {
              key: "Pragma",
              value: "no-cache",
            },
            {
              key: "Expires",
              value: "0",
            },
          ],
          body: { csrfToken: options.csrfToken } as any,
          cookies,
        }
      }

      case "status": {
        const status = await routes.status.GET({
          req,
          options,
        })
        return { ...status, cookies }
      }

      default:
    }
  } else if (method === "POST") {
    switch (endpoint) {
      default:
    }
  }

  return {
    status: 400,
    body: `Error: This action with HTTP is not supported by Flaship Client SDK` as any,
  }
}
