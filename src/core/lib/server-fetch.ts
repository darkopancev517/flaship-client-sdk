import { parseSetCookie } from "set-cookie-parser"

import type { InternalOptions } from "../types"
import type { Params } from "../../react/types"
import type { Cookie } from "./cookie"

export async function fetchServer<T = any>(
  path: string,
  options: InternalOptions,
  req?: {
    params?: Params
    body?: Record<string, unknown>
  }
): Promise<{
  status: number
  ok: boolean
  data: T | null
  cookies?: Cookie[]
}> {
  const cookies: Cookie[] = []

  const url = `${options.serverUrl.base}/${path}${req?.params ? `?${new URLSearchParams(req.params)}` : ""}`

  const request: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.serverAuthToken}`,
    },
  }

  if (req?.body) {
    request.body = JSON.stringify(req.body)
    request.method = "POST"
  }

  const res = await fetch(url, request)
  const data = await res.json()

  if (res.ok) {
    const setCookies = parseSetCookie(res)

    for (const cookie of setCookies) {
      cookies.push({
        name: cookie.name,
        value: cookie.value,
        options: {
          httpOnly: cookie.httpOnly,
          sameSite: "lax",
          maxAge: cookie.maxAge,
          path: cookie.path,
          secure: cookie.secure ?? false,
        },
      })
    }
  }

  return {
    status: res.status,
    ok: res.ok,
    data: Object.keys(data).length > 0 ? data : null,
    cookies: cookies.length > 0 ? cookies : undefined,
  }
}
