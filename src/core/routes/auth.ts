import * as z from "zod"
import { createHash } from "crypto"

import type { RouteParams, ResponseInternal } from "../types"
import { parseError } from "../lib/utils"
import { fetchServer } from "../lib/server-fetch"

const postQueryParams = z.object({
  action: z.enum(["register", "confirm", "signin", "signout", "resetpassword"]),
})

const providerSchema = z.object({
  provider: z.enum(["email", "google", "github"]),
})

const emailAuthSchema = z.object({
  email: z.string(),
  password: z.string().min(4),
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

        const res = await fetchServer("auth", options, {
          params: { action },
          body: {
            tokenHash: token_hash,
            verificationCookie,
          },
        })

        if (!res.ok) {
          const { error } = res.data
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

  try {
    const query = postQueryParams.safeParse(reqQuery)

    if (!query.success) {
      throw new Error("Invalid auth query")
    }

    const { action } = query.data
    const { provider } = providerSchema.parse(reqBody)

    switch (action) {
      case "register": {
        switch (provider) {
          case "email": {
            const { email, password } = emailAuthSchema.parse(reqBody)

            const res = await fetchServer("auth", options, {
              params: { action },
              body: {
                provider: "email",
                email,
                password,
              },
            })

            if (!res.ok) {
              const { error } = res.data
              throw new Error(error)
            }

            return { status: res.status, body: {}, cookies: res.cookies }
          }

          default:
        }
      }

      case "signin": {
        switch (provider) {
          case "email": {
            const { email, password } = emailAuthSchema.parse(reqBody)

            const res = await fetchServer("auth", options, {
              params: { action },
              body: {
                provider: "email",
                email,
                password,
              },
            })

            if (!res.ok) {
              const { error } = res.data
              throw new Error(error)
            }

            const cookies = res.cookies

            const sessionCookie = cookies?.find(
              (cookie) =>
                cookie.name === options.cookies.clientSessionToken.name
            )

            // Verify session cookie
            if (sessionCookie) {
              const sessionCookieValue = sessionCookie.value

              const [clientId, sessionToken, sessionTokenHash] =
                sessionCookieValue.split("|")

              if (options.clientId !== clientId) {
                throw new Error("Invalid session client ID")
              }

              const expectedSessionTokenHash = createHash("sha256")
                .update(`${sessionToken}${options.clientApiKey}`)
                .digest("hex")

              if (expectedSessionTokenHash !== sessionTokenHash) {
                throw new Error("Invalid session token")
              }

              return { status: res.status, body: {}, cookies: res.cookies }
            }
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
