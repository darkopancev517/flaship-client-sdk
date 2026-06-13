import * as z from "zod"
import { parseSetCookie } from "set-cookie-parser"

import * as cookie from "../lib/cookie"
import type { RouteParams, ResponseInternal } from "../types"
import { parseError } from "../lib/utils"

const postQueryParams = z.object({
  action: z.enum(["register", "confirm", "signin", "signout", "resetpassword"]),
})

const registerAuthSchema = z.object({
  provider: z.enum(["email", "google", "github"]),
  email: z.string().optional(),
  password: z.string().optional(),
})

const getQueryParams = z.object({
  action: z.enum(["confirm", "resetpassword"]),
  token_hash: z.string(),
  provider: z.string().optional(),
})

export async function GET(params: RouteParams): Promise<ResponseInternal> {
  const { options, req } = params
  const { query: reqQuery, cookies } = req

  try {
    const query = getQueryParams.safeParse(reqQuery)

    if (!query.success) {
      throw new Error("Invalid auth query")
    }

    const { action, token_hash } = query.data

    switch (action) {
      case "confirm": {
        const verificationCookie =
          cookies?.[options.cookies.clientAuthVerificationToken.name]

        if (!verificationCookie) {
          throw new Error("Invalid verification cookie")
        }

        const reqOptions: RequestInit = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${options.serverAuthToken}`,
          },
          body: JSON.stringify({
            tokenHash: token_hash,
            verificationCookie,
          }),
        }

        const res = await fetch(
          `${options.serverUrl.base}/auth?action=confirm`,
          reqOptions
        )

        if (!res.ok) {
          const { error } = await res.json()
          throw new Error(error)
        }

        return { status: 200, body: {}, redirect: options.url.origin }
      }

      default:
    }

    return {
      status: 400,
      body: { error: `Failed to handle auth ${action} request` },
    }
  } catch (error) {
    const { message, status } = parseError(error)
    return {
      status: status,
      body: { error: message },
      redirect: `${options.url.origin}?error=${encodeURIComponent(message)}`,
    }
  }
}

export async function POST(params: RouteParams): Promise<ResponseInternal> {
  const { options, req } = params
  const { query: reqQuery, body: reqBody } = req
  const cookies: cookie.Cookie[] = []

  try {
    const query = postQueryParams.safeParse(reqQuery)

    if (!query.success) {
      throw new Error("Invalid auth query")
    }

    const { action } = query.data

    switch (action) {
      case "register": {
        const body = registerAuthSchema.parse(reqBody)

        const { provider, email, password } = body

        switch (provider) {
          case "email": {
            if (!email || !password) {
              throw new Error("Invalid email auth register params")
            }

            const reqOptions: RequestInit = {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${options.serverAuthToken}`,
              },
              body: JSON.stringify({
                provider: "email",
                email,
                password,
              }),
            }

            const res = await fetch(
              `${options.serverUrl.base}/auth?action=register`,
              reqOptions
            )

            if (!res.ok) {
              const { error } = await res.json()
              throw new Error(error)
            }

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

            return { status: res.status, body: {}, cookies }
          }

          default:
        }
      }

      default:
    }

    return {
      status: 400,
      body: { error: `Invalid auth ${action} action params` },
    }
  } catch (error) {
    const { message, status } = parseError(error)
    return { status: status, body: { error: message } }
  }
}
