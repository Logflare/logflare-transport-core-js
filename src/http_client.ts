import stream from "stream"

interface IngestTransformsI {
    numbersToFloats: boolean
}

interface LogflareUserOptionsI {
    sourceToken: string
    apiKey: string
    apiBaseUrl?: string
    transforms?: IngestTransformsI
    endpoint?: string
    fromBrowser?: boolean
}

const defaultOptions = {
    apiBaseUrl: "https://api.logflare.app",
}

class NetworkError extends Error {
    name = "NetworkError"

    constructor(
        message: string,
        public response: Response,
        public data: unknown
    ) {
        super(message)
    }
}

class LogflareHttpClient {
    protected readonly sourceToken: string
    protected readonly transforms?: IngestTransformsI
    protected readonly endpoint?: string
    protected readonly apiKey: string
    protected readonly fromBrowser: boolean
    protected readonly apiBaseUrl: string

    public constructor(options: LogflareUserOptionsI) {
        const {sourceToken, apiKey, transforms, endpoint} = options
        if (!sourceToken || sourceToken == "") {
            throw "Logflare API logging transport source token is NOT configured!"
        }
        if (!apiKey || apiKey == "") {
            throw "Logflare API logging transport api key is NOT configured!"
        }
        this.transforms = transforms
        this.sourceToken = sourceToken
        this.endpoint = endpoint
        this.fromBrowser = options.fromBrowser ?? false
        this.apiKey = apiKey
        this.apiBaseUrl = options.apiBaseUrl || defaultOptions.apiBaseUrl
    }

    public async addLogEvent(logEvent: object | object[]): Promise<object> {
        let logEvents = Array.isArray(logEvent) ? logEvent : [logEvent]
        return this.postLogEvents(logEvents)
    }

    public insertStream() {
        const self = this
        const writeStream = new stream.Writable({
            objectMode: true,
            highWaterMark: 1,
        })
        writeStream._write = function (chunk, encoding, callback) {
            self.addLogEvent(chunk)
                .then(() => {
                    callback(null)
                })
                .catch(callback)
        }
        return writeStream
    }

    async postLogEvents(batch: object[]) {
        let path
        if (this.endpoint === "typecasting") {
            path = `/logs/typecasts?api_key=${this.apiKey}&source=${this.sourceToken}`
        } else {
            path = `/logs?api_key=${this.apiKey}&source=${this.sourceToken}`
        }
        const payload = {
            batch,
        }
        try {
            const url = new URL(path, this.apiBaseUrl)

            const response = await fetch(url.toString(), {
                body: JSON.stringify(payload),
                method: "POST",
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json",
                },
            })

            const data = await response.json()

            if (!response.ok) {
                throw new NetworkError(
                    `Network response was not ok for "${url}"`,
                    response,
                    data
                )
            }

            return data
        } catch (e) {
            if (e) {
                if (e instanceof NetworkError && e.response) {
                    console.error(
                        `Logflare API request failed with ${
                            e.response.status
                        } status: ${JSON.stringify(e.data)}`
                    )
                } else if (e instanceof Error) {
                    console.error(e.message)
                }
            }

            return e
        }
    }

    async addTypecasting() {
        const url = new URL("/sources/", this.apiBaseUrl)

        await fetch(url.toString(), {
            method: "POST",
            headers: {
                Accept: "application/json, text/plain, */*",
                "Content-Type": "application/json",
            },
        })
    }
}

export {LogflareHttpClient, LogflareUserOptionsI}
