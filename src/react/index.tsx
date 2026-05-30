import { ClientConfig, CtxOrReq, fetchData } from "../client/_utils"
import { parseUrl } from "../utils/parse-url"

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
