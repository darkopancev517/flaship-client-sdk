import * as z from "zod"
import { createHash } from "crypto"

import * as cookie from "../lib/cookie"
import type { RouteParams, ResponseInternal } from "../types"
import { parseError } from "../lib/utils"
import { fetchServer } from "../lib/server-fetch"

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

const tokenHashSchema = z.object({
  token_hash: z.string(),
})

export async function GET(params: RouteParams): Promise<ResponseInternal> {
  const { options, req } = params
  const { action, providerId, query, cookies: reqCookies, body, method } = req
  const cookies: cookie.Cookie[] = []

  try {
    switch (action) {
      case "confirm": {
        if (providerId === "email") {
          const { token_hash } = tokenHashSchema.parse(query)

          const verificationCookie =
            reqCookies?.[options.cookies.clientVerificationToken.name]

          if (!verificationCookie) {
            throw new Error("Invalid verification cookie")
          }

          const res = await fetchServer("auth/confirm/email", options, {
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
            name: options.cookies.clientVerificationToken.name,
            value: "",
            options: {
              ...options.cookies.clientVerificationToken.options,
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

        break
      }

      case "callback": {
        switch (providerId) {
          case "google": {
            const res = await fetchServer("auth/callback/google", options, {
              body: {
                query,
                body,
                method,
              },
            })

            if (!res.ok) {
              const { error } = res.data
              throw new Error(error)
            }

            return { status: 200, body: {} }
          }

          default:
            throw new Error("Invalid auth callback provider")
        }
      }

      default:
        break
    }

    return {
      status: 400,
      body: { error: `Failed to handle auth ${action ?? ""} request` },
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
  const { action, providerId, body: reqBody, cookies: reqCookies } = req
  const cookies: cookie.Cookie[] = []

  try {
    switch (action) {
      case "register": {
        switch (providerId) {
          case "email": {
            const { email, password } = emailAuthSchema.parse(reqBody)

            const res = await fetchServer("auth/register/email", options, {
              body: {
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
                cookie.name === options.cookies.clientVerificationToken.name
            )

            if (!verificationCookie) {
              throw new Error("Email verification cookie was missing")
            }

            cookies.push({
              name: options.cookies.clientVerificationToken.name,
              value: verificationCookie.value,
              options: options.cookies.clientVerificationToken.options,
            })

            return { status: res.status, body: {}, cookies }
          }

          default:
            throw new Error("Invalid auth register provider")
        }
      }

      case "signin": {
        switch (providerId) {
          case "email": {
            const { email, password } = emailAuthSchema.parse(reqBody)

            const res = await fetchServer("auth/signin/email", options, {
              body: {
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

            break
          }

          case "google": {
            const res = await fetchServer("auth/signin/google", options)

            if (!res.ok) {
              const { error } = res.data
              throw new Error(error)
            }

            const { redirect } = res.data

            if (res.cookies) {
              for (const cookie of res.cookies) {
                cookies.push({
                  name: cookie.name,
                  value: cookie.value,
                  options: cookie.options,
                })
              }
            }

            return { status: res.status, body: {}, redirect, cookies }
          }

          default:
            throw new Error("Invalid signin provider")
        }
      }

      case "resetpassword": {
        if (providerId === "email") {
          const { type } = resetPasswordTypeSchema.parse(reqBody)

          switch (type) {
            case "request": {
              const { email } = resetPasswordRequestSchema.parse(reqBody)

              const res = await fetchServer(
                "auth/resetpassword/email",
                options,
                {
                  body: {
                    type,
                    email,
                  },
                }
              )

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

              const res = await fetchServer(
                "auth/resetpassword/email",
                options,
                {
                  body: {
                    type,
                    tokenHash,
                    resetPasswordCookie,
                    newPassword,
                  },
                }
              )

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
              throw new Error("Invalid reset password request")
          }
        }

        break
      }

      default:
        break
    }

    return {
      status: 400,
      body: { error: `Failed to handle auth ${action ?? ""}.` },
    }
  } catch (error) {
    const { message, status } = parseError(error)
    return { status: status, body: { error: message } }
  }
}
