import * as z from "zod"

import type { RouteParams, ResponseInternal } from "../types"
import { parseError } from "../lib/utils"

const getQuerySchema = z.object({
  connection: z.coerce.boolean().optional(),
  version: z.coerce.boolean().optional(),
})

export async function GET(params: RouteParams): Promise<ResponseInternal> {
  const { req, options } = params
  const { query: reqQuery } = req

  try {
    const query = getQuerySchema.safeParse(reqQuery)

    if (!query.success) {
      throw new Error("Invalid status query")
    }

    const { connection } = query.data

    if (connection) {
      const reqOptions: RequestInit = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${options.serverAuthToken}`,
        },
      }

      const res = await fetch(
        `${options.serverUrl.base}/status?connection=true`,
        reqOptions
      )

      const data = await res.json()

      console.log(data)

      return {
        status: res.status,
        body: {
          connection: Object.keys(data).length > 0 ? data.connection : false,
        },
      }
    }

    return {
      status: 400,
      body: { error: "Invalid status request" },
    }
  } catch (error) {
    const { message, status } = parseError(error)
    return { status: status, body: { error: message } }
  }
}
