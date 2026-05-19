import { ClientConfig, CtxOrReq, fetchData } from "../client/_utils"
import { parseUrl } from "../utils/parse-url"

const __CLIENT: ClientConfig = {
  baseUrl: parseUrl(process.env.FLASHIP_CLIENT_ORIGIN_URL).origin,
  basePath: parseUrl(process.env.FLASHIP_CLIENT_ORIGIN_URL).path,
}

export async function getCsrfToken(params?: CtxOrReq) {
  const response = await fetchData<{ csrfToken: string }>(
    "csrf",
    __CLIENT,
    params
  )
  return response?.csrfToken
}
