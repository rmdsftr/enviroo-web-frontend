import { api } from "./api";

export type NotifRefType =
    | "setoran"
    | "bagi_hasil"
    | "penarikan"
    | "kontrak"
    | "pengajuan"
    | "pengangkutan"
    | "distribusi_sembako"
    | "jadwal_penimbangan"
    | "jadwal_pengangkutan"
    | "pengajuan_pengangkutan"
    | null;

export interface NotifikasiItem {
    notifikasi_id: string;
    user_id: string;
    judul: string;
    pesan: string;
    ref_id: string | null;
    ref_type: NotifRefType;
    is_read: boolean;
    created_at: string;
}

export interface NotifikasiMeta {
    total: number;
    page: number;
    limit: number;
    total_halaman: number;
}

interface GetNotifikasiResponse {
    message: string;
    data: NotifikasiItem[];
    meta: NotifikasiMeta;
}

interface UnreadCountResponse {
    data: { unread_count: number };
}

export const NotifikasiService = {
    async getList(
        userId: string,
        page = 1,
        limit = 20,
    ): Promise<{ data: NotifikasiItem[]; meta: NotifikasiMeta }> {
        const res = await api.get<GetNotifikasiResponse>(`/notifikasi/list/${userId}`, {
            params: { page, limit },
        });
        return { data: res.data.data, meta: res.data.meta };
    },

    async markAsRead(notifikasiId: string): Promise<void> {
        await api.patch(`/notifikasi/read/${notifikasiId}`);
    },

    async markAllAsRead(userId: string): Promise<void> {
        await api.patch(`/notifikasi/read-all/${userId}`);
    },

    async getUnreadCount(userId: string): Promise<number> {
        const res = await api.get<UnreadCountResponse>(`/notifikasi/unread-count/${userId}`);
        return res.data.data.unread_count;
    },
};
