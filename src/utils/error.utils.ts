import axios from "axios";

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
