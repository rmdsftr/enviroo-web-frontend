export interface AppRelease {
    release_id: number;
    version_code: number;
    version_name: string;
    apk_key: string;
    apk_url: string;
    file_size: number;
    changelog: string;
    is_mandatory: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface AppReleaseListResponse {
    message: string;
    data: AppRelease[];
}

export interface AppReleaseResponse {
    message: string;
    data: AppRelease;
}

/** Respons publik GET /app-version: data null jika belum ada rilis. */
export interface VersiTerbaru {
    version_code: number;
    version_name: string;
    apk_url: string;
    file_size: number;
    changelog: string;
    wajib: boolean;
    created_at: string;
}

export interface VersiTerbaruResponse {
    message: string;
    data: VersiTerbaru | null;
}

export interface UploadRilisPayload {
    apk: File;
    version_code: number;
    version_name: string;
    changelog: string;
    wajib: boolean;
}

export interface UpdateRilisPayload {
    changelog?: string;
    wajib?: boolean;
}
