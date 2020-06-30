interface TypecastI {
    path: string[];
    from: string;
    to: string;
}
interface LogflareLogEventParamsI {
    metadata: object;
    message: string;
    timestamp: number;
}
declare const applyCustomTypecasting: (payload: LogflareLogEventParamsI, typecastingRules?: object[] | undefined) => {
    body: LogflareLogEventParamsI;
    typecasts: TypecastI[];
};
declare const applyNumberToStringTypecasting: (payload: LogflareLogEventParamsI) => {
    body: LogflareLogEventParamsI;
    typecasts: TypecastI[];
};
export { applyCustomTypecasting, applyNumberToStringTypecasting };
