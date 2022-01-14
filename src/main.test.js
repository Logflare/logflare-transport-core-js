import {LogflareHttpClient} from "./main"

const testApiKey = "testApiKey"
const testBaseUrl = "http://non-existing.domain"
const testSourceToken = "2222-2222"
const apiResponseSuccess = {message: "Logged!"}

describe("LogflareHttpClient", () => {
    let httpClient
    let nativeFetch

    beforeAll(() => {
        nativeFetch = global.fetch
    })

    beforeEach(() => {
        httpClient = new LogflareHttpClient({
            apiKey: testApiKey,
            sourceToken: testSourceToken,
            apiBaseUrl: "http://non-existing.domain",
        })
    })

    afterEach(() => {
        global.fetch.mockClear()
    })

    afterAll(() => {
        global.fetch = nativeFetch
    })

    it("successfully send a post request", async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve(apiResponseSuccess),
                ok: true,
                status: 200,
            })
        )

        const le = {message: "info log msg", metadata: {p1: "v1"}}
        const response = await httpClient.addLogEvent(le)

        expect(response).toMatchObject(apiResponseSuccess)
        expect(global.fetch).toHaveBeenCalledWith(
            `${testBaseUrl}/logs?api_key=${testApiKey}&source=${testSourceToken}`,
            {
                body: JSON.stringify({batch: [le]}),
                method: "POST",
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json",
                },
            }
        )
    })

    let consoleLogData = ""
    const storeLog = (inputs) => (consoleLogData += inputs)
    it("prints to console on error", async () => {
        const errorResponse = {message: "Schema validation error"}

        console["error"] = jest.fn(storeLog)
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve(errorResponse),
                ok: false,
                status: 406,
            })
        )

        const le = {message: "info log msg", metadata: {p1: "v1"}}

        await httpClient.addLogEvent(le)
        expect(consoleLogData).toBe(
            `Logflare API request failed with 406 status: ${JSON.stringify(
                errorResponse
            )}`
        )
    })
})
