import moxios from "moxios"

import {LogflareHttpClient} from "./main"

const testBaseUrl = "http://non-existing.domain"
const testSourceToken = "2222-2222"
const apiResponseSuccess = {message: "Logged!"}

describe("LogflareHttpClient", () => {
    let httpClient
    let axiosInstance
    beforeEach(() => {
        httpClient = new LogflareHttpClient({
            apiKey: "testApiKey",
            sourceToken: "2222-2222",
            apiBaseUrl: "http://non-existing.domain",
        })
        const axiosInstance = httpClient.axiosInstance
        moxios.install(axiosInstance)
    })

    afterEach(() => {
        moxios.uninstall(axiosInstance)
    })

    it("successfully send a post request", async (done) => {
        const le = {message: "info log msg", metadata: {p1: "v1"}}

        moxios.wait(async () => {
            let request = moxios.requests.mostRecent()

            expect(request.config.baseURL).toBe(testBaseUrl)
            expect(request.headers).toMatchObject({
                Accept: "application/json, text/plain, */*",
                "Content-Type": "application/json",
                "X-API-KEY": "testApiKey",
            })

            expect(request.config.data).toBe(
                JSON.stringify({batch: [le], source: testSourceToken})
            )

            await request.respondWith({
                status: 200,
                response: apiResponseSuccess,
            })
            done()
        })

        const response = await httpClient.addLogEvent(le)
        expect(response).toMatchObject(apiResponseSuccess)
    })

    let consoleLogData = ""
    const storeLog = (inputs) => (consoleLogData += inputs)
    it("prints to console on error", async (done) => {
        console["error"] = jest.fn(storeLog)

        const le = {message: "info log msg", metadata: {p1: "v1"}}

        moxios.wait(async () => {
            let request = moxios.requests.mostRecent()

            await request.respondWith({
                status: 406,
                response: {message: "Schema validation error"},
            })
            done()
        })

        await httpClient.addLogEvent(le)
        expect(consoleLogData).toBe(
            'Logflare API request failed with 406 status: {"message":"Schema validation error"}'
        )
    })
})

describe("LogflareHttpClient with options", () => {
    let httpClient
    let axiosInstance
    beforeEach(() => {
        httpClient = new LogflareHttpClient({
            apiKey: "testApiKey",
            sourceToken: "2222-2222",
            apiBaseUrl: "http://non-existing.domain",
            transforms: {jsNumbers: true},
        })
        const axiosInstance = httpClient.axiosInstance
        moxios.install(axiosInstance)
    })

    afterEach(() => {
        moxios.uninstall(axiosInstance)
    })

    it("trarnsforms js numbers if configured", async (done) => {
        const le = {
            message: "info log msg",
            metadata: {number: 1, number2: 1.0},
        }

        moxios.wait(async () => {
            let request = moxios.requests.mostRecent()

            expect(request.config.baseURL).toBe(testBaseUrl)
            expect(request.headers).toMatchObject({
                Accept: "application/json, text/plain, */*",
                "Content-Type": "application/json",
                "X-API-KEY": "testApiKey",
            })

            console.log(request.config.data)
            expect(request.config.data).toBe(
                '{"batch":[{"body":{"message":"info log msg","metadata":{"number":"1","number2":"1"}},"typecasts":[{"keys":["metadata","number"],"from":"string","to":"number"},{"keys":["metadata","number2"],"from":"string","to":"number"}]}],"source":"2222-2222"}'
            )

            await request.respondWith({
                status: 200,
                response: apiResponseSuccess,
            })
            done()
        })

        const response = await httpClient.addLogEvent(le)
        expect(response).toMatchObject(apiResponseSuccess)
    })
})
