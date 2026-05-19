import { CallbacksOptions } from "../types"

export const defaultCallbacks: CallbacksOptions = {
  redirect({ url, baseUrl }) {
    if (url.startsWith("/")) return `${baseUrl}${url}`
    else if (new URL(url).origin === baseUrl) return url
    return baseUrl
  },
}
