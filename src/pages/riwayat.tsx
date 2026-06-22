import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Tabs from "../components/tabs";
import Table from "../components/table";
import FilterRange from "../components/filter-range";
import SearchBar from "../components/search";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import { type PenimbanganItem } from "../services/penimbangan.service";
import { type PengangkutanItem } from "../services/pengangkutan.service";
import { type PenjualanExternalItem } from "../services/penjualan.service";
import { type RiwayatBagiHasilItem } from "../services/bagi_hasil_penjualan.service";
import type { BagiHasilBsuItem } from "../types/distribusi_sisa.type";
import { type PenarikanItem } from "../services/penarikan.service";
import { useRiwayatData } from "../hooks/useRiwayatData";
import {
    PENIMBANGAN_COLUMNS, PENJUALAN_COLUMNS,
    BAGI_HASIL_COLUMNS, BAGI_HASIL_BSU_COLUMNS, PENARIKAN_COLUMNS,
    BSI_TABS, BSU_TABS, BSM_TABS,
} from "../constants/riwayat.constants";
import "../styles/riwayat.css";
import "../styles/jadwal-bsu.css";

export default function RiwayatPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const role = user?.role?.toLowerCase();
    const isBsi = role === "admin_bsi";
    const isBsu = role === "admin_bsu";

    const tabs = isBsi ? BSI_TABS : isBsu ? BSU_TABS : BSM_TABS;
    const [activeTab, setActiveTab] = useState(tabs[0].id);
    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const {
        hasAngkut, hasPenjualan,
        searchQuery, setSearchQuery,
        penimbanganLoading, penimbanganFrom, setPenimbanganFrom, penimbanganTo, setPenimbanganTo, filteredPenimbangan,
        angkutLoading, angkutColumns, angkutFrom, setAngkutFrom, angkutTo, setAngkutTo, filteredAngkut,
        penjualanLoading, penjualanFrom, setPenjualanFrom, penjualanTo, setPenjualanTo, filteredPenjualan,
        bagiHasilLoading, bagiHasilFrom, setBagiHasilFrom, bagiHasilTo, setBagiHasilTo, filteredBagiHasil,
        bagiHasilBsuLoading, bagiHasilBsuFrom, setBagiHasilBsuFrom, bagiHasilBsuTo, setBagiHasilBsuTo, filteredBagiHasilBsu,
        penarikanLoading, penarikanFrom, setPenarikanFrom, penarikanTo, setPenarikanTo, filteredPenarikan,
    } = useRiwayatData({ bankId: user?.bank_id, isBsu, isBsi });

    const rolePrefix = role === "admin_bsi" ? "/bsi" : role === "admin_bsu" ? "/bsu" : "/bsm";

    return (
        <div className="riwayat-page">

            {/* Header */}
            <div className="riwayat-hero">
                <div className="riwayat-hero-left">
                    <h1>Riwayat Transaksi</h1>
                    <p>Pantau seluruh riwayat transaksi bank sampah Anda</p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={setActiveTab}
                style={{ alignSelf: "flex-start" }}
            />

            {/* ── Tab: Penimbangan ── */}
            {activeTab === "penimbangan" && (
                <>
                    <div className="riwayat-filter-row">
                        <SearchBar
                            placeholder="Cari ID Penimbangan"
                            value={searchQuery}
                            onChange={setSearchQuery}
                            width="300px"
                        />
                        <FilterRange
                            from={penimbanganFrom}
                            to={penimbanganTo}
                            onChange={(f, t) => { setPenimbanganFrom(f); setPenimbanganTo(t); }}
                        />
                    </div>
                    {penimbanganLoading
                        ? <div className="riwayat-loading">Memuat data...</div>
                        : <Table<PenimbanganItem>
                            columns={PENIMBANGAN_COLUMNS}
                            data={filteredPenimbangan}
                            rowKey={(row) => row.penimbangan_id}
                            emptyMessage="Belum ada riwayat penimbangan."
                            onRowClick={(row) => navigate(`${rolePrefix}/riwayat/penimbangan/${row.penimbangan_id}`)}
                          />
                    }
                </>
            )}

            {/* ── Tab: Pengangkutan ── */}
            {activeTab === "pengangkutan" && hasAngkut && (
                <>
                    <div className="riwayat-filter-row">
                        <SearchBar
                            placeholder="Cari ID Pengangkutan..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                            width="300px"
                        />
                        <FilterRange
                            from={angkutFrom}
                            to={angkutTo}
                            onChange={(f, t) => { setAngkutFrom(f); setAngkutTo(t); }}
                        />
                    </div>
                    {angkutLoading
                        ? <div className="riwayat-loading">Memuat data...</div>
                        : <Table<PengangkutanItem>
                            columns={angkutColumns}
                            data={filteredAngkut}
                            rowKey={(row) => row.pengangkutan_id}
                            emptyMessage="Belum ada riwayat pengangkutan."
                            onRowClick={(row) => navigate(`${rolePrefix}/riwayat/pengangkutan/${row.pengangkutan_id}`)}
                          />
                    }
                </>
            )}

            {/* ── Tab: Penjualan ── */}
            {activeTab === "penjualan" && hasPenjualan && (
                <>
                    <div className="riwayat-filter-row">
                        <SearchBar
                            placeholder="Cari ID, pembeli, atau reward..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                            width="300px"
                        />
                        <FilterRange
                            from={penjualanFrom}
                            to={penjualanTo}
                            onChange={(f, t) => { setPenjualanFrom(f); setPenjualanTo(t); }}
                        />
                    </div>
                    {penjualanLoading
                        ? <div className="riwayat-loading">Memuat data...</div>
                        : <Table<PenjualanExternalItem>
                            columns={PENJUALAN_COLUMNS}
                            data={filteredPenjualan}
                            rowKey={(row) => row.penjualan_id}
                            emptyMessage="Belum ada riwayat penjualan."
                            onRowClick={(row) => navigate(`${rolePrefix}/riwayat/penjualan/${row.penjualan_id}`)}
                          />
                    }
                </>
            )}

            {/* ── Tab: Bagi Hasil (BSI / BSM) ── */}
            {activeTab === "bagi_hasil" && !isBsu && (
                <>
                    <div className="riwayat-filter-row">
                        <SearchBar
                            placeholder="Cari ID atau nama reward..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                            width="300px"
                        />
                        <FilterRange
                            from={bagiHasilFrom}
                            to={bagiHasilTo}
                            onChange={(f, t) => { setBagiHasilFrom(f); setBagiHasilTo(t); }}
                        />
                    </div>
                    {bagiHasilLoading
                        ? <div className="riwayat-loading">Memuat data...</div>
                        : <Table<RiwayatBagiHasilItem>
                            columns={BAGI_HASIL_COLUMNS}
                            data={filteredBagiHasil}
                            rowKey={(row) => row.bagi_hasil_id}
                            emptyMessage="Belum ada riwayat bagi hasil."
                            onRowClick={(row) => {
                                const prefix = isBsi ? "/bsi" : "/bsm";
                                navigate(`${prefix}/riwayat/bagi-hasil/${row.bagi_hasil_id}`);
                            }}
                          />
                    }
                </>
            )}

            {/* ── Tab: Bagi Hasil (BSU) ── */}
            {activeTab === "bagi_hasil" && isBsu && (
                <>
                    <div className="riwayat-filter-row">
                        <SearchBar
                            placeholder="Cari ID bagi hasil atau distribusi..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                            width="300px"
                        />
                        <FilterRange
                            from={bagiHasilBsuFrom}
                            to={bagiHasilBsuTo}
                            onChange={(f, t) => { setBagiHasilBsuFrom(f); setBagiHasilBsuTo(t); }}
                        />
                    </div>
                    {bagiHasilBsuLoading
                        ? <div className="riwayat-loading">Memuat data...</div>
                        : <Table<BagiHasilBsuItem>
                            columns={BAGI_HASIL_BSU_COLUMNS}
                            data={filteredBagiHasilBsu}
                            rowKey={(row) => row.penerima_sisa_id}
                            emptyMessage="Belum ada riwayat bagi hasil."
                            onRowClick={(row) => navigate(`/bsu/distribusi-sisa/${row.penerima_sisa_id}`)}
                          />
                    }
                </>
            )}

            {/* ── Tab: Penarikan ── */}
            {activeTab === "penarikan" && (
                <>
                    <div className="riwayat-filter-row">
                        <SearchBar
                            placeholder="Cari ID, nasabah, atau reward..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                            width="300px"
                        />
                        <FilterRange
                            from={penarikanFrom}
                            to={penarikanTo}
                            onChange={(f, t) => { setPenarikanFrom(f); setPenarikanTo(t); }}
                        />
                    </div>
                    {penarikanLoading
                        ? <div className="riwayat-loading">Memuat data...</div>
                        : <Table<PenarikanItem>
                            columns={PENARIKAN_COLUMNS}
                            data={filteredPenarikan}
                            rowKey={(row) => row.penarikan_id}
                            emptyMessage="Belum ada riwayat penarikan."
                            onRowClick={(row) => navigate(`${rolePrefix}/riwayat/penarikan/${row.penarikan_id}`)}
                          />
                    }
                </>
            )}

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
