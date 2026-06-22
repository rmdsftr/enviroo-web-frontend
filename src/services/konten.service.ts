import { api } from "./api";
import type { AddKontenResponse, GetAllKontenResponse, GetKontenByIdResponse } from "../types/konten.type";

export interface UploadKontenPayload {
    bankId: string;
    adminId: string;
    judul: string;
    deskripsi: string;
    thumbnail?: File | null;
    imageBlocks: { index: number; file: File }[];
    bodyJson: string;
    isPublished: boolean;  // true → publish, false → simpan draft
}

export const KontenService = {
    addKonten: async (payload: UploadKontenPayload): Promise<AddKontenResponse> => {
        const formData = new FormData();
        formData.append("bank_id", payload.bankId);
        formData.append("judul", payload.judul);
        formData.append("deskripsi", payload.deskripsi);
        formData.append("body_json", payload.bodyJson);
        formData.append("is_published", payload.isPublished ? "true" : "false");

        if (payload.thumbnail) {
            formData.append("thumbnail", payload.thumbnail);
        }

        for (const imgBlock of payload.imageBlocks) {
            formData.append(`image_${imgBlock.index}`, imgBlock.file);
        }

        const response = await api.post<AddKontenResponse>(
            `/konten/add-konten/${payload.adminId}`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" }, timeout: 60000 }
        );

        return response.data;
    },

    getAllKonten: async (bankId: string, published?: boolean, page?: number): Promise<GetAllKontenResponse> => {
        const params: Record<string, string> = {};
        if (published !== undefined) params.published = published.toString();
        if (page !== undefined) params.page = page.toString();
        const response = await api.get<GetAllKontenResponse>(
            `/konten/all-konten/${bankId}`,
            { params }
        );
        return response.data;
    },

    getAllKontenSuperadmin: async (published?: boolean, page?: number): Promise<GetAllKontenResponse> => {
        const params: Record<string, string> = {};
        if (published !== undefined) params.published = published.toString();
        if (page !== undefined) params.page = page.toString();
        const response = await api.get<GetAllKontenResponse>(
            "/konten/all-konten",
            { params }
        );
        return response.data;
    },

    getKontenById: async (kontenId: string): Promise<GetKontenByIdResponse> => {
        const response = await api.get<GetKontenByIdResponse>(`/konten/get-konten/${kontenId}`);
        return response.data;
    },

    deleteKonten: async (kontenId: string): Promise<{ message: string }> => {
        const response = await api.delete<{ message: string }>(`/konten/delete-konten/${kontenId}`);
        return response.data;
    },

    editKonten: async (kontenId: string, payload: UploadKontenPayload): Promise<AddKontenResponse> => {
        const formData = new FormData();
        formData.append("judul", payload.judul);
        formData.append("deskripsi", payload.deskripsi);
        formData.append("body_json", payload.bodyJson);
        formData.append("is_published", payload.isPublished ? "true" : "false");

        if (payload.thumbnail) {
            formData.append("thumbnail", payload.thumbnail);
        }

        for (const imgBlock of payload.imageBlocks) {
            formData.append(`image_${imgBlock.index}`, imgBlock.file);
        }

        const response = await api.patch<AddKontenResponse>(
            `/konten/edit-konten/${kontenId}`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" }, timeout: 60000 }
        );

        return response.data;
    },
};
