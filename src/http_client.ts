import axios, {AxiosInstance, AxiosResponse} from "axios"
import stream from "stream"

interface LogflareUserOptions {
    sourceToken: string
    apiKey: string
    batchFlushInterval?: number
    batchMaxSize?: number
    apiBaseUrl?: string
}

interface LogflareTransport {
    readonly httpClient: LogflareHttpClient
}

const defaultOptions = {
    apiBaseUrl: "https://api.logflare.app",
    batchFlushInterval: 1000,
    maxBatchSize: 100,
}

class LogflareHttpClient {
    protected readonly axiosInstance: AxiosInstance
    protected readonly sourceToken: string
    protected readonly batchFlushInterval: number
    protected readonly maxBatchSize: number
    protected batch: object[]
    protected readonly batchFlushTimer: any

    public constructor(options: LogflareUserOptions) {
        this.sourceToken = options.sourceToken
        if (!options.sourceToken) {
            throw "Logflare API logging transport source token is NOT configured!"
        }

        if (!options.apiKey) {
            throw "Logflare API logging transport api key is NOT configured!"
        }
        this.batch = []
        this.axiosInstance = axios.create({
            baseURL: options.apiBaseUrl,
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": options.apiKey,
            },
        })

        this.maxBatchSize = options.batchMaxSize ?? defaultOptions.maxBatchSize
        this.batchFlushInterval =
            options.batchFlushInterval ?? defaultOptions.batchFlushInterval
        this.batchFlushTimer = setInterval(
            () => this.flushBatch(),
            this.batchFlushInterval
        )

        this._initializeResponseInterceptor()
    }

    public async addLogEvent(logEvent: object | [object]) {
        const toConcat = Array.isArray(logEvent) ? logEvent : [logEvent]
        this.batch = this.batch.concat(toConcat)

        if (this.batch.length >= this.maxBatchSize) {
            this.flushBatch()
        }
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

    private async flushBatch() {
        if (this.batch.length > 0) {
            const batchInFlight = [...this.batch]
            this.batch = []
            const payload = {
                batch: batchInFlight,
                source: this.sourceToken,
            }
            return this.axiosInstance.post("/logs", payload)
        }
    }

    private _initializeResponseInterceptor = () => {
        this.axiosInstance.interceptors.response.use(
            this._handleResponse,
            this._handleError
        )
    }

    private _handleResponse = ({data}: AxiosResponse) => data
    protected _handleError = (error: any) => Promise.reject(error)
}

export {LogflareHttpClient, LogflareTransport}
