import type { ResponseInternal } from ".."

export interface ClientStatus {
  status: "up" | "down"
  version: string
  description: string
}

export default async function status(): Promise<
  ResponseInternal<ClientStatus>
> {
  return {
    headers: [{ key: "Content-Type", value: "application/json" }],
  }
}
