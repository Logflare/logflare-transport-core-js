/// <reference types="node" />
import { AxiosInstance } from "axios";
import stream from "stream";
interface LogflareUserOptionsI {
    sourceToken: string;
    apiKey: string;
    apiBaseUrl?: string;
    transforms?: object;
    endpoint?: string;
    fromBrowser?: boolean;
}
declare class LogflareHttpClient {
    protected axiosInstance: AxiosInstance;
    protected readonly sourceToken: string;
    protected readonly transforms?: object;
    protected readonly endpoint?: string;
    protected readonly apiKey: string;
    protected readonly fromBrowser: boolean;
    constructor(options: LogflareUserOptionsI);
    addLogEvent(logEvent: object | object[]): Promise<object>;
    insertStream(): stream.Writable;
    postLogEvents(batch: object[]): Promise<any>;
    private _initializeResponseInterceptor;
    private _handleResponse;
    protected _handleError: (error: any) => Promise<never>;
}
export { LogflareHttpClient, LogflareUserOptionsI };
