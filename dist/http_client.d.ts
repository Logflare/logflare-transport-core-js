/// <reference types="node" />
import { AxiosInstance } from "axios";
import stream from "stream";
interface LogflareUserOptionsI {
    sourceToken: string;
    apiKey: string;
    apiBaseUrl?: string;
    transforms?: object;
    endpoint: string;
}
declare class LogflareHttpClient {
    protected axiosInstance: AxiosInstance;
    protected readonly sourceToken: string;
    protected readonly transforms?: object;
    protected readonly endpoint?: string;
    constructor(options: LogflareUserOptionsI);
    addLogEvent(logEvent: object | object[]): Promise<object>;
    insertStream(): stream.Writable;
    private postLogEvents;
    private _initializeResponseInterceptor;
    private _handleResponse;
    protected _handleError: (error: any) => Promise<never>;
}
export { LogflareHttpClient, LogflareUserOptionsI };
