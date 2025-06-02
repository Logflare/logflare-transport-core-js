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
