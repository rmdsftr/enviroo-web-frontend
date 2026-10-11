export interface AddJadwalRequest {
    hari: string;
    minggu_ke: number;
    jam_mulai: string;
    jam_selesai: string;
    jenis_jadwal: "penimbangan" | "pengangkutan";
    is_active: boolean;
    is_rutin: boolean;
    tanggal: string;
    nama_jadwal_spesial: string;
    target_bank_id?: string;
    admin_id: string;
}

export interface JadwalBatchItem {
    hari: string;
    minggu_ke: number;
    jam_mulai: string;
    jam_selesai: string;
}

export interface AddJadwalBatchRequest {
    admin_id: string;
    jenis_jadwal: "penimbangan";
    is_rutin: boolean;
    items: JadwalBatchItem[];
}

export interface AddJadwalBatchResponse {
    message: string;
    data: {
        created: JadwalItem[];
        skipped: Array<{ hari: string; minggu_ke: number; jam_mulai: string; jam_selesai: string; alasan: string }>;
    };
}

export interface JadwalItem {
    jadwal_id: string;
    bank_id: string;
    hari: string;
    minggu_ke: number;
    jam_mulai: string;
    jam_selesai: string;
    jenis_jadwal: string;
    target_bank_id: string;
    is_active: boolean;
    is_rutin: boolean;
    tanggal: string;
    nama_jadwal_spesial: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    bank_name: string;
    target_bank_name?: string;
}

export interface GetJadwalResponse {
    data: {
        penimbangan: JadwalItem[];
        pengangkutan: JadwalItem[];
    };
}

export interface JadwalPenimbanganOccurrence {
    jadwal_id: string;
    tanggal: string;
    jam_mulai: string;
    jam_selesai: string;
    nama_jadwal: string;
    is_rutin: boolean;
    is_active: boolean;
    status_jadwal: "selesai" | "dibatalkan" | "pending" | "upcoming" | string;
}

export interface GetJadwalPenimbanganBankResponse {
    data: JadwalPenimbanganOccurrence[];
}

export interface JadwalMasterRutinItem {
    jadwal_id: string;
    hari: string;
    minggu_ke: number;
    jam_mulai: string;
    jam_selesai: string;
    is_active: boolean;
}

export interface JadwalMasterKhususItem {
    jadwal_id: string;
    nama_jadwal: string;
    tanggal: string;
    jam_mulai: string;
    jam_selesai: string;
    is_active: boolean;
}

export interface JadwalMasterPenimbangan {
    rutin: JadwalMasterRutinItem[];
    khusus: JadwalMasterKhususItem[];
}

export interface GetJadwalMasterPenimbanganResponse {
    data: JadwalMasterPenimbangan;
}

export interface JadwalEditSeed {
    jadwal_id: string;
    is_rutin: boolean;
    hari: string;
    minggu_ke: number;
    tanggal: string;
    nama_jadwal_spesial: string;
    jam_mulai: string;
    jam_selesai: string;
    is_active: boolean;
}

export interface JadwalFormValue {
    type: "rutin" | "spesial";
    hari: string;
    mingguKe: string;
    tanggal: string;
    namaSpesial: string;
    jamMulai: string;
    jamSelesai: string;
    isActive: boolean;
    hariList: string[];
    mingguList: string[];
}

export interface SuperadminJadwalRawItem {
    jadwal_id: string;
    hari?: string;
    minggu_ke?: number;
    tanggal?: string;
    nama_jadwal_spesial?: string;
    jam_mulai: string;
    jam_selesai: string;
    is_active: boolean;
    [key: string]: unknown;
}

export interface SuperadminJadwalBank {
    bank_id: string;
    nama_bank: string;
    rutin: SuperadminJadwalRawItem[];
    tidak_rutin: SuperadminJadwalRawItem[];
}

export interface GetAllJadwalPenimbanganResponse {
    data: {
        bsi: SuperadminJadwalBank[];
        bsm: SuperadminJadwalBank[];
        bsu: SuperadminJadwalBank[];
    };
}

export interface SuperadminPengangkutanRute {
    bsu_id: string;
    nama_bsu: string;
    rutin: SuperadminJadwalRawItem[];
    tidak_rutin: SuperadminJadwalRawItem[];
}

export interface SuperadminPengangkutanBsi {
    bsi_id: string;
    nama_bsi: string;
    rute_bsu: SuperadminPengangkutanRute[];
}

export interface GetAllJadwalPengangkutanResponse {
    data: SuperadminPengangkutanBsi[];
}
