import { FlashipClient } from "../src/index"

const URL = "http://xyz123.localhost:3000"
const ID = "abc123"
const KEY = "123"
const PASSWORD = "123"

describe("FlashipCLient", () => {
  test("should construct the client object correctly", () => {
    const client = new FlashipClient(URL, ID, KEY, PASSWORD)
    expect(client).toBeDefined()
    expect(client).toBeInstanceOf(FlashipClient)
  })

  test("should throw an error if no valid params are provided", () => {
    expect(() => new FlashipClient("", ID, KEY, PASSWORD)).toThrow(
      "flashipUrl is required."
    )

    expect(() => new FlashipClient(URL, "", KEY, PASSWORD)).toThrow(
      "flashipProjectId is required."
    )

    expect(() => new FlashipClient(URL, ID, "", PASSWORD)).toThrow(
      "flashipApiKey is required."
    )

    expect(() => new FlashipClient(URL, ID, KEY, "")).toThrow(
      "flashipPassword is required."
    )
  })

  test("should validate flashipUrl", () => {
    expect(
      () => new FlashipClient("https://xyz123.flaship.io", ID, KEY, PASSWORD)
    ).not.toThrow()

    expect(
      () => new FlashipClient("http://xyz123.localhost:3000", ID, KEY, PASSWORD)
    ).not.toThrow()

    expect(
      () => new FlashipClient("http:localhost:3000", ID, KEY, PASSWORD)
    ).toThrow("Invalid flashipUrl: Must be a valid HTTP or HTTPS URL.")

    expect(
      () => new FlashipClient("https:flaship.io", ID, KEY, PASSWORD)
    ).toThrow("Invalid flashipUrl: Must be a valid HTTP or HTTPS URL.")

    expect(
      () => new FlashipClient("localhost:3000", ID, KEY, PASSWORD)
    ).toThrow("Invalid flashipUrl: Must be a valid HTTP or HTTPS URL.")

    expect(
      () => new FlashipClient("http://localhost:3000", ID, KEY, PASSWORD)
    ).toThrow("Invalid flashipUrl: Provided localhost URL subdomain is malformed.")

    expect(
      () =>
        new FlashipClient(
          "http://abc123.abc123.localhost:3000",
          ID,
          KEY,
          PASSWORD
        )
    ).toThrow("Invalid flashipUrl: Provided localhost URL subdomain is malformed.")

    expect(
      () => new FlashipClient("https://flaship.io", ID, KEY, PASSWORD)
    ).toThrow("Invalid flashipUrl: Provided URL subdomain is malformed.")

    expect(
      () => new FlashipClient("https://abc123.abc123.flaship.io", ID, KEY, PASSWORD)
    ).toThrow("Invalid flashipUrl: Provided URL subdomain is malformed.")

    expect(
      () => new FlashipClient("https://xyz123.flaship.com", ID, KEY, PASSWORD)
    ).toThrow("Invalid flashipUrl domain.")

    expect(
      () => new FlashipClient("https://xyz123.blackrock.io", ID, KEY, PASSWORD)
    ).toThrow("Invalid flashipUrl domain.")
  })

  describe("URL construction", () => {
    test("should construct localhost URL correctly", () => {
      const client = new FlashipClient(URL, ID, KEY, PASSWORD)

      // @ts-ignore
      expect(client.baseUrl.toString()).toEqual("http://localhost:3000/api/client/xyz123/")

      // @ts-ignore
      expect(client.authUrl.toString()).toEqual("http://localhost:3000/api/client/xyz123/auth/v1")

      // @ts-ignore
      expect(client.imageUrl.toString()).toEqual("http://localhost:3000/api/client/xyz123/image/v1")
    })

    test("should construct URL correctly", () => {
      const client = new FlashipClient("https://xyz123.flaship.io", ID, KEY, PASSWORD)

      // @ts-ignore
      expect(client.baseUrl.toString()).toEqual("https://flaship.io/api/client/xyz123/")
    })
  })
})
