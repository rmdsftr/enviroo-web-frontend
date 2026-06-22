import type { RankingBankItem, RankingBankResponse } from "../types/statistik.type";

export const mockRankingBankItems: RankingBankItem[] = [
    { BankID: "b-001", NamaBank: "Bank Sampah Induk Kota Bandung",       JenisBank: "bsi", TotalUang: 48_500_000, TotalSembako: 3200, JumlahPenjualan: 184 },
    { BankID: "b-002", NamaBank: "Bank Sampah Unit Kelurahan Sukasari",  JenisBank: "bsu", TotalUang: 37_200_000, TotalSembako: 2750, JumlahPenjualan: 156 },
    { BankID: "b-003", NamaBank: "Bank Sampah Mandiri Cibeunying",       JenisBank: "bsm", TotalUang: 31_800_000, TotalSembako: 2100, JumlahPenjualan: 132 },
    { BankID: "b-004", NamaBank: "Bank Sampah Unit Antapani Kidul",      JenisBank: "bsu", TotalUang: 26_400_000, TotalSembako: 1890, JumlahPenjualan: 117 },
    { BankID: "b-005", NamaBank: "Bank Sampah Mandiri Babakan Ciparay",  JenisBank: "bsm", TotalUang: 22_100_000, TotalSembako: 1640, JumlahPenjualan:  98 },
    { BankID: "b-006", NamaBank: "Bank Sampah Induk Kota Surabaya",      JenisBank: "bsi", TotalUang: 19_750_000, TotalSembako: 1420, JumlahPenjualan:  89 },
    { BankID: "b-007", NamaBank: "Bank Sampah Unit Wonokromo",           JenisBank: "bsu", TotalUang: 17_300_000, TotalSembako: 1200, JumlahPenjualan:  74 },
    { BankID: "b-008", NamaBank: "Bank Sampah Mandiri Rungkut",          JenisBank: "bsm", TotalUang: 14_900_000, TotalSembako:  980, JumlahPenjualan:  63 },
    { BankID: "b-009", NamaBank: "Bank Sampah Unit Gubeng Tengah",       JenisBank: "bsu", TotalUang: 12_600_000, TotalSembako:  810, JumlahPenjualan:  55 },
    { BankID: "b-010", NamaBank: "Bank Sampah Mandiri Genteng Bali",     JenisBank: "bsm", TotalUang: 10_450_000, TotalSembako:  690, JumlahPenjualan:  47 },
    { BankID: "b-011", NamaBank: "Bank Sampah Induk Kota Semarang",      JenisBank: "bsi", TotalUang:  9_200_000, TotalSembako:  560, JumlahPenjualan:  41 },
    { BankID: "b-012", NamaBank: "Bank Sampah Unit Tembalang",           JenisBank: "bsu", TotalUang:  7_850_000, TotalSembako:  440, JumlahPenjualan:  34 },
    { BankID: "b-013", NamaBank: "Bank Sampah Mandiri Banyumanik",       JenisBank: "bsm", TotalUang:  6_400_000, TotalSembako:  330, JumlahPenjualan:  28 },
    { BankID: "b-014", NamaBank: "Bank Sampah Unit Pedurungan Lor",      JenisBank: "bsu", TotalUang:  5_100_000, TotalSembako:  240, JumlahPenjualan:  22 },
    { BankID: "b-015", NamaBank: "Bank Sampah Mandiri Candisari",        JenisBank: "bsm", TotalUang:  3_750_000, TotalSembako:  160, JumlahPenjualan:  15 },
    { BankID: "b-016", NamaBank: "Bank Sampah Unit Gayamsari",           JenisBank: "bsu", TotalUang:  2_800_000, TotalSembako:  110, JumlahPenjualan:  11 },
    { BankID: "b-017", NamaBank: "Bank Sampah Mandiri Gajah Mungkur",    JenisBank: "bsm", TotalUang:  1_950_000, TotalSembako:   75, JumlahPenjualan:   8 },
    { BankID: "b-018", NamaBank: "Bank Sampah Unit Semarang Utara",      JenisBank: "bsu", TotalUang:  1_200_000, TotalSembako:   42, JumlahPenjualan:   5 },
    { BankID: "b-019", NamaBank: "Bank Sampah Mandiri Genuk",            JenisBank: "bsm", TotalUang:    750_000, TotalSembako:   20, JumlahPenjualan:   3 },
    { BankID: "b-020", NamaBank: "Bank Sampah Unit Tugu Rejo",           JenisBank: "bsu", TotalUang:    300_000, TotalSembako:    8, JumlahPenjualan:   1 },
];

export const mockRankingBankResponse: RankingBankResponse = {
    periode: "2025",
    data: mockRankingBankItems,
};
