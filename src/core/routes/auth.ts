import * as z from "zod"
import { createHash } from "crypto"

import * as cookie from "../lib/cookie"
import type { RouteParams, ResponseInternal } from "../types"
import { parseError } from "../lib/utils"
import { fetchServer } from "../lib/server-fetch"

const postQueryParams = z.object({
  action: z.enum(["register", "confirm", "signin", "resetpassword"]),
})

const providerSchema = z.object({
  provider: z.enum(["email", "google", "github"]),
})

const resetPasswordTypeSchema = z.object({
  type: z.enum(["request", "confirm"]),
})

const resetPasswordRequestSchema = z.object({
  email: z.email(),
})

const resetPasswordConfirmSchema = z.object({
  tokenHash: z.string(),
  newPassword: z.string().min(4),
})

const emailAuthSchema = z.object({
  email: z.string(),
  password: z.string().min(4),
})

const getQueryParams = z.object({
  action: z.enum(["confirm"]),
  token_hash: z.string(),
  provider: z.string().optional(),
})

export async function GET(params: RouteParams): Promise<ResponseInternal> {
  const { options, req } = params
  const { query: reqQuery, cookies: reqCookies } = req
  const cookies: cookie.Cookie[] = []

  try {
    const query = getQueryParams.safeParse(reqQuery)

    if (!query.success) {
      throw new Error("Invalid auth query")
    }

    const { action, token_hash } = query.data

    switch (action) {
      case "confirm": {
        const verificationCookie =
          reqCookies?.[options.cookies.clientAuthVerificationToken.name]

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

        // Delete verification cookie
        cookies.push({
          name: options.cookies.clientAuthVerificationToken.name,
          value: "",
          options: {
            ...options.cookies.clientAuthVerificationToken.options,
            maxAge: 0,
          },
        })

        return { status: 200, body: {}, redirect: options.url.origin, cookies }
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
  const { query: reqQuery, body: reqBody, cookies: reqCookies } = req
  const cookies: cookie.Cookie[] = []

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

            const verificationCookie = res.cookies?.find(
              (cookie) =>
                cookie.name === options.cookies.clientAuthVerificationToken.name
            )

            if (verificationCookie) {
              cookies.push({
                name: options.cookies.clientAuthVerificationToken.name,
                value: verificationCookie.value,
                options: options.cookies.clientAuthVerificationToken.options,
              })

              return { status: res.status, body: {}, cookies }
            }
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

            const sessionCookie = res.cookies?.find(
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

              cookies.push({
                name: options.cookies.clientSessionToken.name,
                value: sessionToken,
                options: options.cookies.clientSessionToken.options,
              })

              return { status: res.status, body: {}, cookies }
            }
          }

          default:
        }
      }

      case "resetpassword": {
        if (provider === "email") {
          const { type } = resetPasswordTypeSchema.parse(reqBody)

          switch (type) {
            case "request": {
              const { email } = resetPasswordRequestSchema.parse(reqBody)

              const res = await fetchServer("auth", options, {
                params: { action },
                body: {
                  provider,
                  type,
                  email,
                },
              })

              if (!res.ok) {
                const { error } = res.data
                throw new Error(error)
              }

              const resetPasswordCookie = res.cookies?.find(
                (cookie) =>
                  cookie.name === options.cookies.clientResetPasswordToken.name
              )

              if (resetPasswordCookie) {
                cookies.push({
                  name: options.cookies.clientResetPasswordToken.name,
                  value: resetPasswordCookie.value,
                  options: options.cookies.clientResetPasswordToken.options,
                })

                return { status: res.status, body: {}, cookies }
              }
            }

            case "confirm": {
              const { tokenHash, newPassword } =
                resetPasswordConfirmSchema.parse(reqBody)

              const resetPasswordCookie =
                reqCookies?.[options.cookies.clientResetPasswordToken.name]

              if (!resetPasswordCookie) {
                throw new Error("Invalid reset password cookie")
              }

              const res = await fetchServer("auth", options, {
                params: { action },
                body: {
                  provider,
                  type,
                  tokenHash,
                  resetPasswordCookie,
                  newPassword,
                },
              })

              if (!res.ok) {
                const { error } = res.data
                throw new Error(error)
              }

              // Delete reset password cookie
              cookies.push({
                name: options.cookies.clientResetPasswordToken.name,
                value: "",
                options: {
                  ...options.cookies.clientResetPasswordToken.options,
                  maxAge: 0,
                },
              })

              return {
                status: 200,
                body: {},
                redirect: options.url.origin,
                cookies,
              }
            }

            default:
          }
        }
      }

      default:
    }

    return {
      status: 400,
      body: { error: `Failed to handle auth ${action}.` },
    }
  } catch (error) {
    const { message, status } = parseError(error)
    return { status: status, body: { error: message } }
  }
}
