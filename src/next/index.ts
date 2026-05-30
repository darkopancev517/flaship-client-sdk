import type { NextApiRequest, NextApiResponse } from "next"

import type { ClientOptions } from "../core/types"
import { ClientHandler } from "../core"
import { setCookie } from "./utils"

async function ClientApiHandler(
  req: NextApiRequest,
  res: NextApiResponse,
  options: ClientOptions
) {
  const handler = await ClientHandler({ req, options })

  res.status(handler.status ?? 200)

  handler.cookies?.forEach((cookie) => setCookie(res, cookie))
  handler.headers?.forEach((h) => res.setHeader(h.key, h.value))

  return res.send(handler.body)
}

function FlashipClient(options: ClientOptions) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    return await ClientApiHandler(req, res, options)
  }
}

export default FlashipClient
