import axios, {AxiosInstance, AxiosResponse} from "axios"
import stream from "stream"

interface LogflareUserOptions {
    sourceToken: string
    apiKey: string
    apiBaseUrl?: string
}

const defaultOptions = {
    apiBaseUrl: "https://api.logflare.app",
}

class LogflareHttpClient {
    protected axiosInstance: AxiosInstance
    protected readonly sourceToken: string

    public constructor(options: LogflareUserOptions) {
        const {sourceToken, apiKey} = options
        if (!sourceToken || sourceToken == "") {
            throw "Logflare API logging transport source token is NOT configured!"
        }
        if (!apiKey || apiKey == "") {
            throw "Logflare API logging transport api key is NOT configured!"
        }
        this.sourceToken = sourceToken
        this.axiosInstance = axios.create({
            baseURL: options.apiBaseUrl || defaultOptions.apiBaseUrl,
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": apiKey,
            },
        })

        this._initializeResponseInterceptor()
    }

    public async addLogEvent(logEvent: object | object[]): Promise<object> {
        const logEvents = Array.isArray(logEvent) ? logEvent : [logEvent]
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

    private async postLogEvents(batch: object[]) {
        const payload = {
            batch,
            source: this.sourceToken,
        }
        return this.axiosInstance.post("/logs", payload)
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
