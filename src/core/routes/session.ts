import { SessionStore } from "../lib/cookie"
import type { InternalOptions, ResponseInternal, Session } from "../types"
import { now } from "../../client/_utils"

interface SessionParams {
  options: InternalOptions
  sessionStore: SessionStore
}

export default async function session(
  params: SessionParams
): Promise<ResponseInternal<Session | {}>> {
  const { options, sessionStore } = params

  const response: ResponseInternal<Session | {}> = {
    body: {},
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
    cookies: [],
  }

  const sessionToken = sessionStore.value

  if (!sessionToken) return response

  try {
    const decodedToken = (await options.jwt.decode({
      token: sessionToken,
      secret: options.clientApiKey,
    })) as any

    if (!decodedToken) throw new Error("Invalid JWT token")

    const expiresTime = decodedToken?.exp as number
    const currentTime = now()

    if (currentTime > expiresTime) {
      throw new Error("Expired JWT token")
    }

    const session: Session = {
      user: {
        id: decodedToken?.id,
        name: decodedToken?.name,
        email: decodedToken?.email,
        image: decodedToken?.image,
        provider: decodedToken?.provider,
      },
      expires: expiresTime,
    }

    // Return session payload as response
    response.body = session
  } catch (error) {
    console.log("JWT_SESSION_ERROR", error as Error)

    response.cookies?.push(...sessionStore.clean())
  }

  return response
}
