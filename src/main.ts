export interface HttpClientOptions {
  sourceToken?: string;
  sourceName?: string;
  apiKey: string;
  apiBaseUrl?: string;
  endpoint?: string;
  debug?: boolean;
  onError?:
    | ((
        payload: {
          batch: object[];
        },
        err: Error,
      ) => void)
    | undefined;
}
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

      const response = await fetch(url.toString(), {
        body: JSON.stringify(payload),
        method: "POST",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
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
}
