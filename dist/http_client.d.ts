/// <reference types="node" />
import { AxiosInstance } from "axios";
import stream from "stream";
interface IngestTransformsI {
    numbersToFloats: boolean;
}
interface LogflareUserOptionsI {
    sourceToken: string;
    apiKey: string;
    apiBaseUrl?: string;
    transforms?: IngestTransformsI;
    endpoint?: string;
    fromBrowser?: boolean;
}
declare class LogflareHttpClient {
    protected axiosInstance: AxiosInstance;
    protected readonly sourceToken: string;
    protected readonly transforms?: IngestTransformsI;
    protected readonly endpoint?: string;
    protected readonly apiKey: string;
    protected readonly fromBrowser: boolean;
    constructor(options: LogflareUserOptionsI);
    addLogEvent(logEvent: object | object[]): Promise<object>;
    insertStream(): stream.Writable;
    postLogEvents(batch: object[]): Promise<any>;
    addTypecasting(): Promise<void>;
    private _initializeResponseInterceptor;
    private _handleResponse;
    protected _handleError: (error: any) => Promise<never>;
}
export { LogflareHttpClient, LogflareUserOptionsI };
