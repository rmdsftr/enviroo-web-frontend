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
    role_target: string;
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
        page = 1,
        limit = 20,
    ): Promise<{ data: NotifikasiItem[]; meta: NotifikasiMeta }> {
        const res = await api.get<GetNotifikasiResponse>("/notifikasi/list", {
            params: { page, limit, role_target: "admin" },
        });
        return { data: res.data.data, meta: res.data.meta };
    },

    async markAsRead(notifikasiId: string): Promise<void> {
        await api.patch(`/notifikasi/read/${notifikasiId}`);
    },

    async markAllAsRead(): Promise<void> {
        await api.patch("/notifikasi/read-all");
    },

    async getUnreadCount(): Promise<number> {
        const res = await api.get<UnreadCountResponse>("/notifikasi/unread-count");
        return res.data.data.unread_count;
    },
};
