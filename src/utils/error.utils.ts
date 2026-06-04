import axios from "axios";

/**
 * Extracts a human-readable error message from an API error.
 * Reads `response.data.error` or `response.data.message` from Axios errors,
 * then falls back to the provided default message.
 */
export function getApiError(err: unknown, fallback: string): string {
    if (axios.isAxiosError(err)) {
        return (
            err.response?.data?.error ||
            err.response?.data?.message ||
            fallback
        );
    }
    return fallback;
}
