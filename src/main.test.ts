import http from "node:http";
import type { AddressInfo } from "node:net";
import { HttpClient, NetworkError } from "./main";
import {
  vi,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
  type MockedFunction,
} from "vitest";

const testApiKey = "testApiKey";
const testBaseUrl = "http://non-existing.domain";
const testSourceToken = "2222-2222";
const testSourceName = "test-source-name";
const apiResponseSuccess = { message: "Logged!" };
// Captured before any test replaces global.fetch with a mock.
const realFetch = globalThis.fetch;

describe("HttpClient", () => {
  let httpClient: HttpClient;
  let httpClientOnError: HttpClient;
  let httpClientWithSourceName: HttpClient;
  let nativeFetch: typeof fetch;
  let onErrorCallback: MockedFunction<any>;

  beforeAll(() => {
    nativeFetch = global.fetch;
  });

  beforeEach(() => {
    console["error"] = vi.fn();
    onErrorCallback = vi.fn();

    httpClient = new HttpClient({
      apiKey: testApiKey,
      sourceToken: testSourceToken,
      apiBaseUrl: "http://non-existing.domain",
    });
    httpClientOnError = new HttpClient({
      apiKey: testApiKey,
      sourceToken: testSourceToken,
      apiBaseUrl: "http://non-existing.domain",
      onError: onErrorCallback,
      debug: true,
    });
    httpClientWithSourceName = new HttpClient({
      apiKey: testApiKey,
      sourceName: testSourceName,
      apiBaseUrl: "http://non-existing.domain",
    });
  });

  afterEach(() => {
    (global.fetch as MockedFunction<typeof fetch>).mockClear();
  });

  afterAll(() => {
    global.fetch = nativeFetch;
  });

  it("successfully send a post request", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(apiResponseSuccess),
        ok: true,
        status: 200,
      } as Response),
    );

    const le = { message: "info log msg", metadata: { p1: "v1" } };
    const response = await httpClient.postLogEvents([le]);

    expect(response).toMatchObject(apiResponseSuccess);
    expect(global.fetch).toHaveBeenCalledWith(
      `${testBaseUrl}/logs?source=${testSourceToken}`,
      {
        body: JSON.stringify({ batch: [le] }),
        method: "POST",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
          "X-API-Key": testApiKey,
        },
      },
    );
  });

  it("successfully send a post request with sourceName", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(apiResponseSuccess),
        ok: true,
        status: 200,
      } as Response),
    );

    const le = { message: "info log msg", metadata: { p1: "v1" } };
    const response = await httpClientWithSourceName.postLogEvents([le]);

    expect(response).toMatchObject(apiResponseSuccess);
    expect(global.fetch).toHaveBeenCalledWith(
      `${testBaseUrl}/logs?source_name=${testSourceName}`,
      {
        body: JSON.stringify({ batch: [le] }),
        method: "POST",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
          "X-API-Key": testApiKey,
        },
      },
    );
  });

  it("throws error when neither sourceToken nor sourceName is provided", () => {
    expect(() => {
      new HttpClient({
        apiKey: testApiKey,
        apiBaseUrl: testBaseUrl,
      });
    }).toThrow(
      "Ingestion source is not configured. sourceToken or sourceName is not set.",
    );
  });

  it("throws error when both sourceToken and sourceName are provided", () => {
    expect(() => {
      new HttpClient({
        apiKey: testApiKey,
        sourceToken: testSourceToken,
        sourceName: testSourceName,
        apiBaseUrl: testBaseUrl,
      });
    }).toThrow("Only one of sourceName or sourceToken can be set.");
  });

  it("returns error on HTTP error", async () => {
    const errorResponse = { message: "Schema validation error" };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(errorResponse),
        ok: false,
        status: 406,
      } as Response),
    );

    const le = { message: "info log msg", metadata: { p1: "v1" } };

    const result = await httpClient.postLogEvents([le]);
    expect(result).toBeInstanceOf(NetworkError);
    expect((result as NetworkError).message).toMatch(
      /Network response was not ok for/,
    );
    expect((result as NetworkError).data).toBe(errorResponse);
  });

  it("returns error on HTTP error with sourceName", async () => {
    const errorResponse = { message: "Schema validation error" };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(errorResponse),
        ok: false,
        status: 406,
      } as Response),
    );

    const le = { message: "info log msg", metadata: { p1: "v1" } };

    const result = await httpClientWithSourceName.postLogEvents([le]);
    expect(result).toBeInstanceOf(NetworkError);
    expect((result as NetworkError).message).toMatch(
      /Network response was not ok for/,
    );
    expect((result as NetworkError).data).toBe(errorResponse);
  });

  it("invoke onError callback on error when debug is enabled", async () => {
    const errorResponse = { message: "Schema validation error" };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(errorResponse),
        ok: false,
        status: 406,
      } as Response),
    );

    const le = { message: "info log msg", metadata: { p1: "v1" } };

    const result = await httpClientOnError.postLogEvents([le]);

    expect(result).toBeInstanceOf(NetworkError);
    expect(onErrorCallback).toHaveBeenCalledTimes(1);

    const [payload, err] = onErrorCallback.mock.calls[0];
    expect(payload).toStrictEqual({
      batch: [le],
    });
    expect(err).toBeInstanceOf(NetworkError);
    expect((err as NetworkError).message).toMatch(
      /Network response was not ok for/,
    );
    expect((err as NetworkError).data).toBe(errorResponse);
  });

  it("invoke onError callback on error with sourceName when debug is enabled", async () => {
    const httpClientSourceNameOnError = new HttpClient({
      apiKey: testApiKey,
      sourceName: testSourceName,
      apiBaseUrl: "http://non-existing.domain",
      onError: onErrorCallback,
      debug: true,
    });

    const errorResponse = { message: "Schema validation error" };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(errorResponse),
        ok: false,
        status: 406,
      } as Response),
    );

    const le = { message: "info log msg", metadata: { p1: "v1" } };

    const result = await httpClientSourceNameOnError.postLogEvents([le]);

    expect(result).toBeInstanceOf(NetworkError);
    expect(onErrorCallback).toHaveBeenCalledTimes(1);

    const [payload, err] = onErrorCallback.mock.calls[0];
    expect(payload).toStrictEqual({
      batch: [le],
    });
    expect(err).toBeInstanceOf(NetworkError);
    expect((err as NetworkError).message).toMatch(
      /Network response was not ok for/,
    );
    expect((err as NetworkError).data).toBe(errorResponse);
  });

  it("invokes onError callback and logs to console when debug is enabled", async () => {
    const httpClientDebugEnabled = new HttpClient({
      apiKey: testApiKey,
      sourceToken: testSourceToken,
      apiBaseUrl: "http://non-existing.domain",
      onError: onErrorCallback,
      debug: true,
    });

    const errorResponse = { message: "Schema validation error" };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(errorResponse),
        ok: false,
        status: 406,
      } as Response),
    );

    const le = { message: "info log msg", metadata: { p1: "v1" } };

    const result = await httpClientDebugEnabled.postLogEvents([le]);

    expect(result).toBeInstanceOf(NetworkError);
    expect(onErrorCallback).toHaveBeenCalledTimes(1);

    const [payload, err] = onErrorCallback.mock.calls[0];
    expect(payload).toStrictEqual({
      batch: [le],
    });
    expect(err).toBeInstanceOf(NetworkError);

    // Check console.error was called for debug logging
    expect(console.error).toHaveBeenCalledWith(
      `Logflare API request failed with 406 status: ${JSON.stringify(errorResponse)}`,
    );
  });

  it("invokes onError callback but does not log to console when debug is disabled", async () => {
    const httpClientDebugDisabled = new HttpClient({
      apiKey: testApiKey,
      sourceToken: testSourceToken,
      apiBaseUrl: "http://non-existing.domain",
      onError: onErrorCallback,
      debug: false,
    });

    const errorResponse = { message: "Schema validation error" };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(errorResponse),
        ok: false,
        status: 406,
      } as Response),
    );

    const le = { message: "info log msg", metadata: { p1: "v1" } };

    const result = await httpClientDebugDisabled.postLogEvents([le]);

    expect(result).toBeInstanceOf(NetworkError);
    expect(onErrorCallback).toHaveBeenCalledTimes(1);

    const [payload, err] = onErrorCallback.mock.calls[0];
    expect(payload).toStrictEqual({
      batch: [le],
    });
    expect(err).toBeInstanceOf(NetworkError);

    // Check console.error was NOT called when debug is disabled
    expect(console.error).not.toHaveBeenCalled();
  });
});

describe("HttpClient request timeout", () => {
  const le = { message: "info log msg" };
  // How the test server answers: never, with headers and part of the body,
  // or with a complete JSON response.
  let respond: "never" | "partial-body" | "ok";
  let server: http.Server;
  let baseUrl: string;
  let onError: MockedFunction<any>;

  beforeAll(async () => {
    globalThis.fetch = realFetch;
    server = http.createServer((_req, res) => {
      if (respond === "partial-body") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.write("{");
      } else if (respond === "ok") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(apiResponseSuccess));
      }
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    respond = "never";
    onError = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    server.closeAllConnections();
  });

  const createClient = (options: { requestTimeout?: number } = {}) =>
    new HttpClient({
      apiKey: testApiKey,
      sourceToken: testSourceToken,
      apiBaseUrl: baseUrl,
      onError,
      ...options,
    });

  it("gives up when no response arrives within requestTimeout", async () => {
    const result = await createClient({ requestTimeout: 100 }).postLogEvents([
      le,
    ]);

    expect(result).toBeInstanceOf(Error);
    expect((result as Error).name).toBe("TimeoutError");
    expect(onError).toHaveBeenCalledWith({ batch: [le] }, result);
  });

  it("gives up when the response body stalls past requestTimeout", async () => {
    respond = "partial-body";

    const result = await createClient({ requestTimeout: 100 }).postLogEvents([
      le,
    ]);

    expect(result).toBeInstanceOf(Error);
    expect((result as Error).name).toBe("TimeoutError");
    expect(onError).toHaveBeenCalledWith({ batch: [le] }, result);
  });

  it("sends without a timeout by default", async () => {
    respond = "ok";
    const timeout = vi.spyOn(AbortSignal, "timeout");

    const result = await createClient().postLogEvents([le]);

    expect(result).toStrictEqual(apiResponseSuccess);
    expect(timeout).not.toHaveBeenCalled();
  });

  it("sends without a timeout when requestTimeout is 0", async () => {
    respond = "ok";

    const result = await createClient({ requestTimeout: 0 }).postLogEvents([
      le,
    ]);

    expect(result).toStrictEqual(apiResponseSuccess);
    expect(onError).not.toHaveBeenCalled();
  });

  it.each([
    ["a fractional value", 1500.5],
    ["a value above the largest timer delay", 2 ** 31],
    ["Infinity", Infinity],
  ])(
    "still sends with %s as requestTimeout",
    async (_label, requestTimeout) => {
      respond = "ok";

      const result = await createClient({ requestTimeout }).postLogEvents([le]);

      expect(result).toStrictEqual(apiResponseSuccess);
      expect(onError).not.toHaveBeenCalled();
    },
  );

  it("sends without a timeout where AbortSignal.timeout is unavailable", async () => {
    respond = "ok";
    const original = AbortSignal.timeout;
    (AbortSignal as any).timeout = undefined;

    try {
      const result = await createClient({ requestTimeout: 5000 }).postLogEvents(
        [le],
      );

      expect(result).toStrictEqual(apiResponseSuccess);
      expect(onError).not.toHaveBeenCalled();
    } finally {
      AbortSignal.timeout = original;
    }
  });
});
