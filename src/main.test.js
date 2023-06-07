import {LogflareHttpClient} from "./main"

const testApiKey = "testApiKey"
const testBaseUrl = "http://non-existing.domain"
const testSourceToken = "2222-2222"
const apiResponseSuccess = {message: "Logged!"}

describe("LogflareHttpClient", () => {
    let httpClient
    let httpClientOnError
    let nativeFetch
    let consoleErrorData = []
    const storeLog = (inputs) => consoleErrorData.push(inputs)
    const onErrorCallback = jest.fn((payload, err) => {
        console.error(payload)
        console.error(err)
    })

    beforeAll(() => {
        nativeFetch = global.fetch
        console["error"] = jest.fn(storeLog)
    })

    beforeEach(() => {
        httpClient = new LogflareHttpClient({
            apiKey: testApiKey,
            sourceToken: testSourceToken,
            apiBaseUrl: "http://non-existing.domain",
        })
        httpClientOnError = new LogflareHttpClient({
            apiKey: testApiKey,
            sourceToken: testSourceToken,
            apiBaseUrl: "http://non-existing.domain",
            onError: onErrorCallback,
        })
    })

    afterEach(() => {
        global.fetch.mockClear()
        consoleErrorData = []
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

    it("prints to console on error", async () => {
        const errorResponse = {message: "Schema validation error"}

        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve(errorResponse),
                ok: false,
                status: 406,
            })
        )

        const le = {message: "info log msg", metadata: {p1: "v1"}}

        await httpClient.addLogEvent(le)
        expect(consoleErrorData[0]).toBe(
            `Logflare API request failed with 406 status: ${JSON.stringify(
                errorResponse
            )}`
        )
    })

    it("invoke onError callback on error", async () => {
        const errorResponse = {message: "Schema validation error"}

        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve(errorResponse),
                ok: false,
                status: 406,
            })
        )

        const le = {message: "info log msg", metadata: {p1: "v1"}}

        await httpClientOnError.addLogEvent(le)
        const [message, payload, err] = consoleErrorData
        expect(message).toBe(
            `Logflare API request failed with 406 status: ${JSON.stringify(
                errorResponse
            )}`
        )
        expect(onErrorCallback).toHaveBeenCalledTimes(1)
        expect(payload).toStrictEqual({
            batch: [le],
        })
        expect(err.message).toMatch(/Network response was not ok for/)
        expect(err.data).toBe(errorResponse)
    })
})
