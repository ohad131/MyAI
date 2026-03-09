import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { getErrorMessage } from "@/api/client";

describe("getErrorMessage", () => {
  it("maps backend unavailable network errors", () => {
    const error = new AxiosError("Network Error", "ERR_NETWORK");
    expect(getErrorMessage(error)).toBe(
      "Cannot reach the server. Is the backend running?",
    );
  });

  it("surfaces Ollama/backend detail messages when provided", () => {
    const error = new AxiosError(
      "Request failed",
      "ERR_BAD_RESPONSE",
      undefined,
      undefined,
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: {},
        config: { headers: {} } as never,
        data: { detail: "Ollama service unavailable" },
      },
    );

    expect(getErrorMessage(error)).toBe("Ollama service unavailable");
  });

  it("maps generic 5xx failures to a stable fallback message", () => {
    const error = new AxiosError(
      "Request failed",
      "ERR_BAD_RESPONSE",
      undefined,
      undefined,
      {
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
        config: { headers: {} } as never,
        data: {},
      },
    );

    expect(getErrorMessage(error)).toBe("Server error. Check the backend logs.");
  });
});
