import axios, {AxiosInstance, AxiosResponse} from "axios"

interface LogflareUserOptions {
    sourceToken: string
    apiKey: string
    batchFlushInterval?: number
    batchMaxSize?: number
    apiBaseUrl?: string
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

    public addLogEvent(logEvent: object) {
        this.batch.push(logEvent)

        if (this.batch.length >= this.maxBatchSize) {
            this.flushBatch()
        }
    }

    private flushBatch() {
        if (this.batch.length > 0) {
            const batchInFlight = [...this.batch]
            this.batch = []
            const payload = {
                batch: batchInFlight,
                source: this.sourceToken,
            }
            this.axiosInstance.post("/logs", payload)
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

export {LogflareHttpClient}
