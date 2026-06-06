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
        maxAge: 15 * 60,
        path: "/",
        secure: useSecureCookies,
      },
    }
  }
}
