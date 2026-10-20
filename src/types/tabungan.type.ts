export interface AntrianPencairanItem {
    nomor: number;
    nasabah_id: string;
    nama_nasabah: string;
    foto_nasabah: string;
    sisa_qty: number;
    tanggal_setor: string;
}

export interface AntrianPencairanResponse {
    bank_id: string;
    sampah_id: string;
    nama_sampah: string;
    satuan_sampah: string;
    antrian: AntrianPencairanItem[];
}
