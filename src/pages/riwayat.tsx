import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaFileExport } from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import Tabs from "../components/tabs";
import Table from "../components/table";
import Pagination from "../components/pagination";
import FilterRange from "../components/filter-range";
import SearchBar from "../components/search";
import Button from "../components/button";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import PopupExportLaporan from "../layouts/popup-export-laporan";
import { PenimbanganService, type PenimbanganItem } from "../services/penimbangan.service";
import { type PengangkutanItem } from "../services/pengangkutan.service";
import { PenjualanService, type PenjualanExternalItem } from "../services/penjualan.service";
import { BagiHasilService, type RiwayatBagiHasilItem } from "../services/bagi_hasil_penjualan.service";
import type { BagiHasilBsuItem } from "../types/distribusi_sisa.type";
import { PenarikanService, type PenarikanItem } from "../services/penarikan.service";
import { useRiwayatData } from "../hooks/useRiwayatData";
import {
    PENIMBANGAN_COLUMNS, PENJUALAN_COLUMNS,
    BAGI_HASIL_COLUMNS, BAGI_HASIL_BSU_COLUMNS, PENARIKAN_COLUMNS,
    BSI_TABS, BSU_TABS, BSM_TABS,
} from "../constants/riwayat.constants";
import "../styles/riwayat.css";
import "../styles/jadwal-bsu.css";

type ExportLaporanTab = "penimbangan" | "penjualan" | "bagi_hasil" | "penarikan";

const EXPORT_LAPORAN_CONFIG: Record<ExportLaporanTab, {
    title: string;
    fileLabel: string;
    download: (bankId: string, start: string, end: string) => Promise<Blob>;
}> = {
    penimbangan: {
        title: "Ekspor Laporan Penimbangan",
        fileLabel: "laporan-penimbangan",
        download: PenimbanganService.exportRekapLaporan,
    },
    penjualan: {
        title: "Ekspor Laporan Penjualan",
        fileLabel: "laporan-penjualan",
        download: PenjualanService.exportRekapLaporan,
    },
    bagi_hasil: {
        title: "Ekspor Laporan Bagi Hasil",
        fileLabel: "laporan-bagi-hasil",
        download: BagiHasilService.exportRekapLaporan,
    },
    penarikan: {
        title: "Ekspor Laporan Penarikan",
        fileLabel: "laporan-penarikan",
        download: PenarikanService.exportRekapLaporan,
    },
};

export default function RiwayatPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const role = user?.role?.toLowerCase();
    const isBsi = role === "admin_bsi";
    const isBsu = role === "admin_bsu";
    const isBsm = role === "admin_bsm";

    const tabs = isBsi ? BSI_TABS : isBsu ? BSU_TABS : BSM_TABS;
    const [activeTab, setActiveTab] = useState(tabs[0].id);
    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [exportLaporanTab, setExportLaporanTab] = useState<ExportLaporanTab | null>(null);

    const {
        hasAngkut, hasPenjualan,
        searchQuery, setSearchQuery, setPage,
        penimbanganLoading, penimbanganFrom, setPenimbanganFrom, penimbanganTo, setPenimbanganTo, pagedPenimbangan,
        angkutLoading, angkutColumns, angkutFrom, setAngkutFrom, angkutTo, setAngkutTo, pagedAngkut,
        penjualanLoading, penjualanFrom, setPenjualanFrom, penjualanTo, setPenjualanTo, pagedPenjualan,
        bagiHasilLoading, bagiHasilFrom, setBagiHasilFrom, bagiHasilTo, setBagiHasilTo, pagedBagiHasil,
        bagiHasilBsuLoading, bagiHasilBsuFrom, setBagiHasilBsuFrom, bagiHasilBsuTo, setBagiHasilBsuTo, pagedBagiHasilBsu,
        penarikanLoading, penarikanFrom, setPenarikanFrom, penarikanTo, setPenarikanTo, pagedPenarikan,
    } = useRiwayatData({ bankId: user?.bank_id, isBsu, isBsi });

    const rolePrefix = role === "admin_bsi" ? "/bsi" : role === "admin_bsu" ? "/bsu" : "/bsm";

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        setPage(1);
    };

    const renderPagination = (paged: { currentPage: number; totalPages: number }) => (
        <div className="riwayat-pagination-row">
            <Pagination
                currentPage={paged.currentPage}
                totalPages={paged.totalPages}
                onPageChange={setPage}
            />
        </div>
    );

    const defaultExportEnd = new Date().toISOString().slice(0, 10);
    const defaultExportStart = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    })();

    const handleDownloadLaporan = async (start: string, end: string) => {
        if (!user?.bank_id || !exportLaporanTab) return;
        const config = EXPORT_LAPORAN_CONFIG[exportLaporanTab];
        try {
            const blob = await config.download(user.bank_id, start, end);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${config.fileLabel}-${user.bank_id}-${start}_${end}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setExportLaporanTab(null);
        } catch {
            setPopupNotif({ message: "Gagal mengekspor laporan. Silakan coba lagi.", type: "error" });
        }
    };

    return (
        <div className="riwayat-page">

            <div className="riwayat-hero">
                <div className="riwayat-hero-left">
                    <h1>Riwayat Transaksi</h1>
                    <p>Pantau seluruh riwayat transaksi bank sampah Anda</p>
                </div>
            </div>

            <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={(id) => { setActiveTab(id); setPage(1); }}
                style={{ alignSelf: "flex-start" }}
            />

            {activeTab === "penimbangan" && (
                <>
                    <div className="riwayat-filter-row">
                        <SearchBar
                            placeholder="Cari ID Penimbangan"
                            value={searchQuery}
                            onChange={handleSearch}
                            width="300px"
                        />
                        <div className="riwayat-filter-right">
                            <FilterRange
                                from={penimbanganFrom}
                                to={penimbanganTo}
                                onChange={(f, t) => { setPenimbanganFrom(f); setPenimbanganTo(t); setPage(1); }}
                            />
                            <Button
                                icon={<FaFileExport />}
                                color="secondary"
                                variant="solid"
                                size="default"
                                isRounded
                                onClick={() => setExportLaporanTab("penimbangan")}
                            >
                                Ekspor Laporan
                            </Button>
                        </div>
                    </div>
                    {penimbanganLoading
                        ? <div className="riwayat-loading">Memuat data...</div>
                        : <Table<PenimbanganItem>
                            columns={PENIMBANGAN_COLUMNS}
                            data={pagedPenimbangan.items}
                            rowKey={(row) => row.penimbangan_id}
                            emptyMessage="Belum ada riwayat penimbangan."
                            onRowClick={(row) => navigate(`${rolePrefix}/riwayat/penimbangan/${row.penimbangan_id}`)}
                          />
                    }
                    {!penimbanganLoading && renderPagination(pagedPenimbangan)}
                </>
            )}

            {activeTab === "pengangkutan" && hasAngkut && (
                <>
                    <div className="riwayat-filter-row">
                        <SearchBar
                            placeholder="Cari ID Pengangkutan..."
                            value={searchQuery}
                            onChange={handleSearch}
                            width="300px"
                        />
                        <FilterRange
                            from={angkutFrom}
                            to={angkutTo}
                            onChange={(f, t) => { setAngkutFrom(f); setAngkutTo(t); setPage(1); }}
                        />
                    </div>
                    {angkutLoading
                        ? <div className="riwayat-loading">Memuat data...</div>
                        : <Table<PengangkutanItem>
                            columns={angkutColumns}
                            data={pagedAngkut.items}
                            rowKey={(row) => row.pengangkutan_id}
                            emptyMessage="Belum ada riwayat pengangkutan."
                            onRowClick={(row) => navigate(`${rolePrefix}/riwayat/pengangkutan/${row.pengangkutan_id}`)}
                          />
                    }
                    {!angkutLoading && renderPagination(pagedAngkut)}
                </>
            )}

            {activeTab === "penjualan" && hasPenjualan && (
                <>
                    <div className="riwayat-filter-row">
                        <SearchBar
                            placeholder="Cari ID, pembeli, atau reward..."
                            value={searchQuery}
                            onChange={handleSearch}
                            width="300px"
                        />
                        <div className="riwayat-filter-right">
                            <FilterRange
                                from={penjualanFrom}
                                to={penjualanTo}
                                onChange={(f, t) => { setPenjualanFrom(f); setPenjualanTo(t); setPage(1); }}
                            />
                            <Button
                                icon={<FaFileExport />}
                                color="secondary"
                                variant="solid"
                                size="default"
                                isRounded
                                onClick={() => setExportLaporanTab("penjualan")}
                            >
                                Ekspor Laporan
                            </Button>
                        </div>
                    </div>
                    {penjualanLoading
                        ? <div className="riwayat-loading">Memuat data...</div>
                        : <Table<PenjualanExternalItem>
                            columns={PENJUALAN_COLUMNS}
                            data={pagedPenjualan.items}
                            rowKey={(row) => row.penjualan_id}
                            emptyMessage="Belum ada riwayat penjualan."
                            onRowClick={(row) => navigate(`${rolePrefix}/riwayat/penjualan/${row.penjualan_id}`)}
                          />
                    }
                    {!penjualanLoading && renderPagination(pagedPenjualan)}
                </>
            )}

            {activeTab === "bagi_hasil" && !isBsu && (
                <>
                    <div className="riwayat-filter-row">
                        <SearchBar
                            placeholder="Cari ID atau nama reward..."
                            value={searchQuery}
                            onChange={handleSearch}
                            width="300px"
                        />
                        {isBsm ? (
                            <div className="riwayat-filter-right">
                                <FilterRange
                                    from={bagiHasilFrom}
                                    to={bagiHasilTo}
                                    onChange={(f, t) => { setBagiHasilFrom(f); setBagiHasilTo(t); setPage(1); }}
                                />
                                <Button
                                    icon={<FaFileExport />}
                                    color="secondary"
                                    variant="solid"
                                    size="default"
                                    isRounded
                                    onClick={() => setExportLaporanTab("bagi_hasil")}
                                >
                                    Ekspor Laporan
                                </Button>
                            </div>
                        ) : (
                            <FilterRange
                                from={bagiHasilFrom}
                                to={bagiHasilTo}
                                onChange={(f, t) => { setBagiHasilFrom(f); setBagiHasilTo(t); setPage(1); }}
                            />
                        )}
                    </div>
                    {bagiHasilLoading
                        ? <div className="riwayat-loading">Memuat data...</div>
                        : <Table<RiwayatBagiHasilItem>
                            columns={BAGI_HASIL_COLUMNS}
                            data={pagedBagiHasil.items}
                            rowKey={(row) => row.bagi_hasil_id}
                            emptyMessage="Belum ada riwayat bagi hasil."
                            onRowClick={(row) => {
                                const prefix = isBsi ? "/bsi" : "/bsm";
                                navigate(`${prefix}/riwayat/bagi-hasil/${row.bagi_hasil_id}`);
                            }}
                          />
                    }
                    {!bagiHasilLoading && renderPagination(pagedBagiHasil)}
                </>
            )}

            {activeTab === "bagi_hasil" && isBsu && (
                <>
                    <div className="riwayat-filter-row">
                        <SearchBar
                            placeholder="Cari ID bagi hasil atau distribusi..."
                            value={searchQuery}
                            onChange={handleSearch}
                            width="300px"
                        />
                        <FilterRange
                            from={bagiHasilBsuFrom}
                            to={bagiHasilBsuTo}
                            onChange={(f, t) => { setBagiHasilBsuFrom(f); setBagiHasilBsuTo(t); setPage(1); }}
                        />
                    </div>
                    {bagiHasilBsuLoading
                        ? <div className="riwayat-loading">Memuat data...</div>
                        : <Table<BagiHasilBsuItem>
                            columns={BAGI_HASIL_BSU_COLUMNS}
                            data={pagedBagiHasilBsu.items}
                            rowKey={(row) => row.penerima_sisa_id}
                            emptyMessage="Belum ada riwayat bagi hasil."
                            onRowClick={(row) => navigate(`/bsu/distribusi-sisa/${row.penerima_sisa_id}`)}
                          />
                    }
                    {!bagiHasilBsuLoading && renderPagination(pagedBagiHasilBsu)}
                </>
            )}

            {activeTab === "penarikan" && (
                <>
                    <div className="riwayat-filter-row">
                        <SearchBar
                            placeholder="Cari ID, nasabah, atau reward..."
                            value={searchQuery}
                            onChange={handleSearch}
                            width="300px"
                        />
                        <div className="riwayat-filter-right">
                            <FilterRange
                                from={penarikanFrom}
                                to={penarikanTo}
                                onChange={(f, t) => { setPenarikanFrom(f); setPenarikanTo(t); setPage(1); }}
                            />
                            <Button
                                icon={<FaFileExport />}
                                color="secondary"
                                variant="solid"
                                size="default"
                                isRounded
                                onClick={() => setExportLaporanTab("penarikan")}
                            >
                                Ekspor Laporan
                            </Button>
                        </div>
                    </div>
                    {penarikanLoading
                        ? <div className="riwayat-loading">Memuat data...</div>
                        : <Table<PenarikanItem>
                            columns={PENARIKAN_COLUMNS}
                            data={pagedPenarikan.items}
                            rowKey={(row) => row.penarikan_id}
                            emptyMessage="Belum ada riwayat penarikan."
                            onRowClick={(row) => navigate(`${rolePrefix}/riwayat/penarikan/${row.penarikan_id}`)}
                          />
                    }
                    {!penarikanLoading && renderPagination(pagedPenarikan)}
                </>
            )}

            <PopupExportLaporan
                isOpen={exportLaporanTab !== null}
                title={exportLaporanTab ? EXPORT_LAPORAN_CONFIG[exportLaporanTab].title : undefined}
                defaultStart={defaultExportStart}
                defaultEnd={defaultExportEnd}
                onDownload={handleDownloadLaporan}
                onCancel={() => setExportLaporanTab(null)}
            />

            {popupNotif && (
                <PopupNotifikasi
                    message={popupNotif.message}
                    type={popupNotif.type}
                    onClose={() => setPopupNotif(null)}
                />
            )}
        </div>
    );
}
