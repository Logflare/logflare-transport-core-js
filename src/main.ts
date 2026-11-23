export interface HttpClientOptions {
  sourceToken?: string;
  sourceName?: string;
  apiKey: string;
  apiBaseUrl?: string;
  endpoint?: string;
  debug?: boolean;
  /**
   * Milliseconds to wait for a request, including reading its response,
   * before giving up and reporting a TimeoutError through onError.
   * No timeout unless set. Fractions are rounded down. 0, or a value above
   * the largest timer delay (2147483647), also means no timeout. A negative
   * or NaN value means no timeout too, with a warning when debug is on.
   * Runtimes without AbortSignal.timeout send without a timeout, with a
   * warning when debug is on.
   */
  requestTimeout?: number;
  onError?:
    | ((
        payload: {
          batch: object[];
        },
        err: Error,
      ) => void)
    | undefined;
}

// The largest delay timers accept. Node turns a longer delay into 1 ms.
const MAX_TIMER_DELAY = 2147483647;

// The timeout in whole milliseconds, or undefined for no timeout: unset, 0,
// negative, NaN, or above the largest timer delay. An out-of-range value
// would throw or abort almost at once, failing every request.
const usableTimeout = (requestTimeout?: number): number | undefined => {
  if (requestTimeout === undefined) {
    return undefined;
  }
  const ms = Math.floor(requestTimeout);
  return ms > 0 && ms <= MAX_TIMER_DELAY ? ms : undefined;
};

const supportsTimeoutSignal = (): boolean =>
  typeof AbortSignal !== "undefined" &&
  typeof AbortSignal.timeout === "function";

export class NetworkError extends Error {
  name = "NetworkError";

  constructor(
    message: string,
    public response: Response,
    public data: unknown,
  ) {
    super(message);
  }
}

export class HttpClient {
  protected readonly sourceToken?: string;
  protected readonly sourceName?: string;
  protected readonly endpoint?: string;
  protected readonly apiKey: string;
  protected readonly apiBaseUrl: string;
  protected readonly debug: boolean;
  protected readonly requestTimeout?: number;
  /**
   * onError takes in an optional callback function to handle any errors returned by logflare
   */
  protected readonly onError?:
    | ((
        payload: {
          batch: object[];
        },
        err: Error,
      ) => void)
    | undefined;

  public constructor(options: HttpClientOptions) {
    const { sourceName, sourceToken, apiKey } = options;
    if (!sourceToken && !sourceName) {
      throw "Ingestion source is not configured. sourceToken or sourceName is not set.";
    }
    if (sourceName && sourceToken) {
      throw "Only one of sourceName or sourceToken can be set.";
    }
    if (!apiKey || apiKey == "") {
      throw "Ingestion API key is not configured.";
    }
    this.sourceName = sourceName;
    this.sourceToken = sourceToken;
    this.debug = options.debug ?? false;
    this.requestTimeout = options.requestTimeout;
    if (this.debug && this.requestTimeout !== undefined) {
      if (!(this.requestTimeout >= 0)) {
        console.warn(
          `Logflare requestTimeout must be 0 or more milliseconds, got ${this.requestTimeout}. Sending without a timeout.`,
        );
      } else if (
        usableTimeout(this.requestTimeout) !== undefined &&
        !supportsTimeoutSignal()
      ) {
        console.warn(
          "Logflare requestTimeout is set, but this runtime has no AbortSignal.timeout. Sending without a timeout.",
        );
      }
    }
    this.apiKey = apiKey;
    this.apiBaseUrl = options.apiBaseUrl ?? "https://api.logflare.app";
    this.onError = options.onError;
  }

  public async postLogEvents(batch: object[]) {
    let path;
    if (this.sourceToken) {
      // sourceToken takes precedence
      path = `/logs?source=${this.sourceToken}`;
    } else {
      path = `/logs?source_name=${this.sourceName}`;
    }
    const payload = { batch };
    try {
      const url = new URL(path, this.apiBaseUrl);
      const signal = this.timeoutSignal();

      const response = await fetch(url.toString(), {
        body: JSON.stringify(payload),
        method: "POST",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
        ...(signal && { signal }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new NetworkError(
          `Network response was not ok for "${url}"`,
          response,
          data,
        );
      }

      return data;
    } catch (e) {
      if (e && e instanceof Error) {
        // log this out only when debugging
        if (this.debug === true) {
          if (e instanceof NetworkError && e.response) {
            console.error(
              `Logflare API request failed with ${
                e.response.status
              } status: ${JSON.stringify(e.data)}`,
            );
          } else {
            console.error(e.message);
          }
        }
        this.onError?.(payload, e);
      }

      return e;
    }
  }

  // No signal without a usable timeout, or on runtimes without
  // AbortSignal.timeout.
  private timeoutSignal(): AbortSignal | undefined {
    const ms = usableTimeout(this.requestTimeout);
    return ms !== undefined && supportsTimeoutSignal()
      ? AbortSignal.timeout(ms)
      : undefined;
  }
}
