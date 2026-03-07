import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 120_000,
});

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === "ERR_NETWORK")
      return "Cannot reach the server. Is the backend running?";
    if (error.code === "ECONNABORTED")
      return "Request timed out. The server might be busy.";

    const status = error.response?.status;
    const data = error.response?.data;

    if (typeof data === "string" && data.length > 0 && data.length < 200)
      return data;
    if (data?.detail) {
      if (typeof data.detail === "string") return data.detail;
      if (Array.isArray(data.detail))
        return data.detail
          .map((d: Record<string, string>) => d.msg || d.message || String(d))
          .join(", ");
    }
    if (data?.message) return data.message;

    if (status === 404) return "Resource not found";
    if (status === 422) return "Invalid request — check your input";
    if (status && status >= 500)
      return "Server error. Check the backend logs.";

    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}
