import type { NextApiRequest } from "next"

import * as routes from "./routes"
import type {
  ClientEndpoint,
  ClientOptions,
  RequestInternal,
  ResponseInternal,
} from "./types"
import { detectOrigin } from "../utils/detect-origin"
import { init } from "./init"

async function toInternalRequest(
  req: NextApiRequest
): Promise<RequestInternal> {
  const { client, ...query } = req.query
  const { headers, body, method, cookies } = req
  const host = headers?.["x-forwarded-host"] ?? headers?.host

  return {
    method,
    cookies,
    headers,
    query,
    body,
    origin: detectOrigin(host, headers?.["x-forwarded-proto"]),
    endpoint: client?.[0] as ClientEndpoint,
  }
}

export async function ClientHandler<
  Body extends string | Record<string, any> | any[],
>(params: {
  req: NextApiRequest
  options: ClientOptions
}): Promise<ResponseInternal<Body>> {
  const { options: clientOptions, req: incomingRequest } = params

  const req = await toInternalRequest(incomingRequest)

  const { endpoint, method = "GET" } = req

  const { options, cookies } = await init({ req, clientOptions })

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
