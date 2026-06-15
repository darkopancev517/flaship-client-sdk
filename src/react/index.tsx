import { apiBaseUrl, ClientConfig, CtxOrReq, fetchData } from "../client/_utils"
import { parseUrl } from "../utils/parse-url"
import { Params, ClientResponse, AuthAction } from "./types"

const __CLIENT: ClientConfig = {
  baseUrl: parseUrl(process.env.NEXT_PUBLIC_SITE_URL).origin,
  basePath: parseUrl(process.env.NEXT_PUBLIC_SITE_URL).path,
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
