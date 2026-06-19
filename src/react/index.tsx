import * as React from "react"

import {
  apiBaseUrl,
  ClientConfig,
  CtxOrReq,
  fetchData,
  now,
} from "../client/_utils"
import { parseUrl } from "../utils/parse-url"
import type { Params, ClientResponse, AuthAction } from "./types"
import type { Session } from "../core/types"

const __CLIENT: ClientConfig = {
  baseUrl: parseUrl(process.env.NEXT_PUBLIC_SITE_URL).origin,
  basePath: parseUrl(process.env.NEXT_PUBLIC_SITE_URL).path,
  _session: undefined,
  _lastSync: 0,
  _getSession: () => { },
}

export async function getCsrfToken(params?: CtxOrReq) {
  const response = await fetchData<{ csrfToken: string }>(
    "csrf",
    __CLIENT,
    params
  )

  return response?.csrfToken
}

export async function getConnectionStatus(): Promise<boolean> {
  const response = await fetchData<{ connection: boolean }>(
    "status?connection=true",
    __CLIENT
  )

  return response?.connection ?? false
}

export async function signUpWithEmail({
  email,
  password,
}: {
  email: string
  password: string
}): Promise<ClientResponse> {
  return await auth("register", {
    body: {
      provider: "email",
      email,
      password,
    },
  })
}

export async function signInWithEmail({
  email,
  password,
}: {
  email: string
  password: string
}): Promise<ClientResponse> {
  return await auth("signin", {
    body: {
      provider: "email",
      email,
      password,
    },
  })
}

export async function auth(
  action: AuthAction,
  req: {
    params?: Params
    body?: Record<string, unknown>
  }
): Promise<ClientResponse> {
  const baseUrl = apiBaseUrl(__CLIENT)
  const authUrl = `${baseUrl}/auth?action=${action}${req.params ? `&${new URLSearchParams(req.params)}` : ""}`

  const response = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    // @ts-expect-error
    body: new URLSearchParams({
      ...req.body,
      csrfToken: await getCsrfToken(),
    }),
  })

  const data = await response.json()
  const error = !response.ok ? data.error : ""

  return {
    error,
    status: response.status,
    ok: response.ok,
    url: error ? null : data.url,
  }
}

export type SessionContextValue<R extends boolean = false> = R extends true
  ?
  | { data: Session; status: "authenticated" }
  | { data: null; status: "loading" }
  :
  | { data: Session; status: "authenticated" }
  | {
    data: null
    status: "unauthenticated" | "loading"
  }

export const SessionContext = React.createContext?.<
  SessionContextValue | undefined
>(undefined)

export function useSession<R extends boolean>(): SessionContextValue<R> {
  if (!SessionContext) {
    throw new Error("React Context is unavailable in Server Components")
  }

  // @ts-expect-error Satisfy TS if branch on line below
  const value: SessionContextValue<R> = React.useContext(SessionContext)

  if (!value && process.env.NODE_ENV !== "production") {
    throw new Error("`useSession` must be wrapped in a <SessionProvider />")
  }

  return value
}

export async function getSession() {
  const session = await fetchData<Session>("session", __CLIENT)
  return session
}

interface SessionProviderProps {
  children: React.ReactNode
  refetchOnWindowFocus?: boolean
}

export function SessionProvider(props: SessionProviderProps) {
  if (!SessionContext) {
    throw new Error("React Context is unavailable in Server Components")
  }

  const { children } = props
  const [session, setSession] = React.useState<Session | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    __CLIENT._getSession = async ({ event } = {}) => {
      try {
        const storageEvent = event === "storage"
        // We should always update if we don't have a client session yet
        // or if there are events from other tabs/windows
        if (storageEvent || __CLIENT._session === undefined) {
          __CLIENT._lastSync = now()
          __CLIENT._session = await getSession()
          setSession(__CLIENT._session)
          return
        }

        if (
          // If there is no time defined for when a session should be considered
          // stale, then it's okay to use the value we have until an event is
          // triggered which updates it
          !event ||
          // If the client doesn't have a session then we don't need to call
          // the server to check if it does (if they have signed in via another
          // tab or window that will come through as a "stroage" event
          // event anyway)
          __CLIENT._session === null ||
          // Bail out early if the client session is not stale yet
          now() < __CLIENT._lastSync
        ) {
          return
        }

        // An event or session staleness occurred, update the client session.
        __CLIENT._lastSync = now()
        __CLIENT._session = await getSession()
        setSession(__CLIENT._session)
      } catch (error) {
        console.log("CLIENT SESSION ERROR", error as Error)
      } finally {
        setLoading(false)
      }
    }

    __CLIENT._getSession()

    return () => {
      __CLIENT._lastSync = 0
      __CLIENT._session = undefined
      __CLIENT._getSession = () => { }
    }
  }, [])

  React.useEffect(() => {
    const { refetchOnWindowFocus = true } = props
    // Listen for when the page is visible, if the user switches tabs
    // and makes our tab visible again, re-fetch the session, but only if
    // this feature is not disabled.
    const visibilityHandler = () => {
      if (refetchOnWindowFocus && document.visibilityState === "visible") {
        __CLIENT._getSession({ event: "visibilitychange" })
      }
    }
    document.addEventListener("visibilitychange", visibilityHandler, false)
    return () =>
      document.removeEventListener("visibilitychange", visibilityHandler, false)
  }, [props.refetchOnWindowFocus])

  const value: any = React.useMemo(
    () => ({
      data: session,
      status: loading
        ? "loading"
        : session
          ? "authenticated"
          : "unauthenticated",
    }),
    [session, loading]
  )

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}
