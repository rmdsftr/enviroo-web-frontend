import { api } from "./api";
import type {
    AppReleaseListResponse,
    AppReleaseResponse,
    UploadRilisPayload,
    UpdateRilisPayload,
    VersiTerbaruResponse,
} from "../types/app_release.type";

/** Link install permanen: backend me-redirect ke APK versi terbaru. */
export const LINK_INSTALL_APK = `${import.meta.env.VITE_API_URL}/app-version/latest`;

export const AppReleaseService = {
    /** Endpoint publik: dipakai admin bank untuk menampilkan versi terbaru. */
    async getVersiTerbaru(): Promise<VersiTerbaruResponse> {
        const response = await api.get<VersiTerbaruResponse>("/app-version");
        return response.data;
    },

    async getRilis(): Promise<AppReleaseListResponse> {
        const response = await api.get<AppReleaseListResponse>("/app-version/rilis");
        return response.data;
    },

    async uploadRilis(
        data: UploadRilisPayload,
        onProgress?: (persen: number) => void,
    ): Promise<AppReleaseResponse> {
        const formData = new FormData();
        formData.append("apk", data.apk);
        formData.append("version_code", data.version_code.toString());
        formData.append("version_name", data.version_name);
        formData.append("changelog", data.changelog);
        formData.append("wajib", data.wajib ? "true" : "false");

        const response = await api.post<AppReleaseResponse>("/app-version/rilis", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            // APK puluhan MB: timeout default (10 detik) pasti terlewati.
            timeout: 0,
            onUploadProgress: (e) => {
                if (onProgress && e.total) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            },
        });
        return response.data;
    },

    async updateRilis(releaseId: number, data: UpdateRilisPayload): Promise<AppReleaseResponse> {
        const response = await api.patch<AppReleaseResponse>(`/app-version/rilis/${releaseId}`, data);
        return response.data;
    },

    async deleteRilis(releaseId: number): Promise<{ message: string }> {
        const response = await api.delete(`/app-version/rilis/${releaseId}`);
        return response.data;
    },
};
