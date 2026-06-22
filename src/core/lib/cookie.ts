import type { NextRequest } from "next/server"
import type { NextApiRequest } from "next"

import { CookieOption, CookiesOptions } from "../types"

export interface Cookie extends CookieOption {
  value: string
}

export function defaultCookies(useSecureCookies: boolean): CookiesOptions {
  const cookiePrefix = useSecureCookies ? "__Secure-" : ""
  return {
    csrfToken: {
      // Default to __Host- for CSRF token for additional protection if using useSecureCookies
      // NB: The `__Host-` prefix is stricter than the `__Secure-` prefix.
      name: `${useSecureCookies ? "__Host-" : ""}flaship-client.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    clientAuthVerificationToken: {
      name: `${cookiePrefix}flaship-client.auth-verification-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60,
        secure: useSecureCookies,
      },
    },
    clientSessionToken: {
      name: `${cookiePrefix}flaship-client.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
        secure: useSecureCookies,
      },
    },
    clientResetPasswordToken: {
      name: `${cookiePrefix}flaship-client.reset-password-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60,
        secure: useSecureCookies,
      },
    },
  }
}

const ALLOWED_COOKIE_SIZE = 4096
// Based on commented out section above
const ESTIMATED_EMPTY_COOKIE_SIZE = 163
const CHUNK_SIZE = ALLOWED_COOKIE_SIZE - ESTIMATED_EMPTY_COOKIE_SIZE

type Chunks = Record<string, string>

export class SessionStore {
  #chunks: Chunks = {}
  #option: CookieOption

  constructor(
    option: CookieOption,
    req: Partial<{
      cookies: NextRequest["cookies"] | NextApiRequest["cookies"]
      headers: NextRequest["headers"] | NextApiRequest["headers"]
    }>
  ) {
    this.#option = option

    const { cookies } = req
    const { name: cookieName } = option

    if (typeof cookies?.getAll === "function") {
      // Next.js ^v13.0.1 (Edge Env)
      for (const { name, value } of cookies.getAll()) {
        if (name.startsWith(cookieName)) {
          this.#chunks[name] = value
        }
      }
    } else if (cookies instanceof Map) {
      for (const name of cookies.keys()) {
        if (name.startsWith(cookieName)) this.#chunks[name] = cookies.get(name)
      }
    } else {
      for (const name in cookies) {
        // @ts-expect-error
        if (name.startsWith(cookieName)) this.#chunks[name] = cookies[name]
      }
    }
  }

  /**
   * The JWT Session or database Session ID
   * constructed from the cookie chunks.
   */
  get value() {
    // Sort the chunks by their keys before joining
    const sortedKeys = Object.keys(this.#chunks).sort((a, b) => {
      const aSuffix = parseInt(a.split(".").pop() ?? "0")
      const bSuffix = parseInt(b.split(".").pop() ?? "0")

      return aSuffix - bSuffix
    })

    // Use the sorted keys to join the chunks in the correct order
    return sortedKeys.map((key) => this.#chunks[key]).join("")
  }

  /** Given a cookie, return a list of cookies, chunked to fit the allowed cookie size. */
  #chunk(cookie: Cookie): Cookie[] {
    const chunkCount = Math.ceil(cookie.value.length / CHUNK_SIZE)

    if (chunkCount === 1) {
      this.#chunks[cookie.name] = cookie.value
      return [cookie]
    }

    const cookies: Cookie[] = []
    for (let i = 0; i < chunkCount; i++) {
      const name = `${cookie.name}.${i}`
      const value = cookie.value.substr(i * CHUNK_SIZE, CHUNK_SIZE)
      cookies.push({ ...cookie, name, value })
      this.#chunks[name] = value
    }

    console.debug("CHUNKING_SESSION_COOKIE", {
      message: `Session cookie exceeds allowed ${ALLOWED_COOKIE_SIZE} bytes.`,
      emptyCookieSize: ESTIMATED_EMPTY_COOKIE_SIZE,
      valueSize: cookie.value.length,
      chunks: cookies.map((c) => c.value.length + ESTIMATED_EMPTY_COOKIE_SIZE),
    })

    return cookies
  }

  /** Returns cleaned cookie chunks. */
  #clean(): Record<string, Cookie> {
    const cleanedChunks: Record<string, Cookie> = {}
    for (const name in this.#chunks) {
      delete this.#chunks?.[name]
      cleanedChunks[name] = {
        name,
        value: "",
        options: { ...this.#option.options, maxAge: 0 },
      }
    }
    return cleanedChunks
  }

  /**
   * Given a cookie value, return new cookies, chunked, to fit the allowed cookie size.
   * If the cookie has changed from chunked to unchunked or vice versa,
   * it deletes the old cookies as well.
   */
  chunk(value: string, options: Partial<Cookie["options"]>): Cookie[] {
    // Assume all cookies should be cleaned by default
    const cookies: Record<string, Cookie> = this.#clean()

    // Calculate new chunks
    const chunked = this.#chunk({
      name: this.#option.name,
      value,
      options: { ...this.#option.options, ...options },
    })

    // Update stored chunks / cookies
    for (const chunk of chunked) {
      cookies[chunk.name] = chunk
    }

    return Object.values(cookies)
  }

  /** Returns a list of cookies that should be cleaned. */
  clean(): Cookie[] {
    return Object.values(this.#clean())
  }
}
