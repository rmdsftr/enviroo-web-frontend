import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { KatalogService } from "../services/katalog.service";
import { SembakoService } from "../services/sembako.service";
import type { KatalogSampah, KatalogDetail } from "../types/katalog.type";
import type { KatalogSembakoItem } from "../types/sembako.type";
import Pagination from "../components/pagination";
import { FaBoxOpen, FaBasketShopping, FaPlus, FaFileExport } from "react-icons/fa6";
import Button from "../components/button";
import Tabs from "../components/tabs";
import FilterPill from "../components/filter-pill";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import PopupConfirmation from "../layouts/popup-confirmation";
import Table from "../components/table";
import FilterRange from "../components/filter-range";
import SearchBar from "../components/search";
import { SampahCard } from "../components/SampahCard";
import { SembakoCard } from "../components/SembakoCard";
import { KatalogSampahFormModal, type SampahFormData } from "../modals/KatalogSampahFormModal";
import { KatalogSampahDetailModal } from "../modals/KatalogSampahDetailModal";
import { KatalogSembakoFormModal, type SembakoFormData } from "../modals/KatalogSembakoFormModal";
import { KatalogSembakoDetailModal } from "../modals/KatalogSembakoDetailModal";
import { useKatalogData } from "../hooks/useKatalogData";
import { SATUAN_OPTIONS, buildDistribusiColumns } from "../constants/katalog.constants";
import { getApiError } from "../utils/error.utils";
import "../styles/katalog.css";
import "../styles/jadwal-bsu.css";

export default function KatalogPage() {
    const navigate = useNavigate();
    const {
        user,
        isAdminBsi, isAdminBsu, isAdminBsm, canEdit, isViewingBSU, canEditSembako,
        categories, rewards,
        katalogList, sembakoList,
        sampahPage, setSampahPage, sampahMeta,
        sembakoPage, setSembakoPage, sembakoMeta,
        sembakoFilterBank, setSembakoFilterBank,
        bsuList, bsuRiwayat, setBsuRiwayat,
        distribusiLoading, distribusiFrom, setDistribusiFrom, distribusiTo, setDistribusiTo,
        distribusiSearch, setDistribusiSearch,
        filterKategori, setFilterKategori,
        filterSatuan, setFilterSatuan,
        filterReward, setFilterReward,
        filteredSampah, filteredDistribusi,
        fetchKatalog, fetchSembako,
    } = useKatalogData();

    const [notif, setNotif] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
    const [confirmState, setConfirmState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
    const showNotif = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => setNotif({ message, type });
    const showConfirm = (title: string, message: string, onConfirm: () => void) => setConfirmState({ isOpen: true, title, message, onConfirm });
    const closeConfirm = () => setConfirmState(null);

    const [activeTab, setActiveTab] = useState<"sampah" | "sembako">("sampah");
    const [formMode, setFormMode] = useState<"add" | "edit-item" | "add-sembako" | "edit-sembako" | null>(null);
    const [selectedItem, setSelectedItem] = useState<KatalogSampah | null>(null);
    const [selectedItemDetail, setSelectedItemDetail] = useState<KatalogDetail | null>(null);
    const [selectedSembako, setSelectedSembako] = useState<KatalogSembakoItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (!user?.bank_id) return;
        setIsExporting(true);
        try {
            const blob = activeTab === "sampah"
                ? await KatalogService.exportKatalogSampah(user.bank_id)
                : await KatalogService.exportKatalogSembako(user.bank_id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = activeTab === "sampah"
                ? `katalog-sampah-${user.bank_id}.xlsx`
                : `katalog-sembako-${user.bank_id}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            showNotif("Gagal mengunduh laporan. Silakan coba lagi.", "error");
        } finally {
            setIsExporting(false);
        }
    };

    const handleViewDetail = async (item: KatalogSampah) => {
        setSelectedItem(item);
        setSelectedItemDetail(null);
        try {
            const res = await KatalogService.getDetailSampah(item.sampah_id);
            setSelectedItemDetail(res.data);
        } catch {
            console.error("Failed to load detail sampah");
        }
    };

    const handleSampahSubmit = async (data: SampahFormData, foto: File | null) => {
        if (!user?.bank_id) return;
        setIsSubmitting(true);
        try {
            if (formMode === "add") {
                await KatalogService.addKatalog(user.bank_id, { ...data, foto: foto || undefined });
                showNotif("Katalog sampah berhasil ditambahkan!");
            } else if (formMode === "edit-item" && selectedItem) {
                await KatalogService.editKatalog(selectedItem.sampah_id, {
                    syarat_pemilahan: data.syarat_pemilahan,
                    foto: foto || undefined,
                });
                showNotif("Detail katalog berhasil diperbarui!");
                setSelectedItem(null);
                setSelectedItemDetail(null);
            }
            setFormMode(null);
            fetchKatalog(sampahPage);
        } catch (error) {
            showNotif(getApiError(error, "Gagal menyimpan perubahan."), "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!selectedItem) return;
        showConfirm(
            "Hapus Item Katalog",
            `Yakin ingin menghapus "${selectedItem.nama_sampah}"? Tindakan ini tidak bisa dibatalkan.`,
            async () => {
                closeConfirm();
                try {
                    await KatalogService.deleteKatalogSampah(selectedItem.sampah_id);
                    showNotif("Item berhasil dihapus!");
                    setSelectedItem(null);
                    setSelectedItemDetail(null);
                    if (katalogList.length === 1 && sampahPage > 1) {
                        const prevPage = sampahPage - 1;
                        setSampahPage(prevPage);
                        fetchKatalog(prevPage);
                    } else {
                        fetchKatalog(sampahPage);
                    }
                } catch (error) {
                    showNotif(getApiError(error, "Gagal menghapus item."), "error");
                }
            }
        );
    };

    const handleViewSembakoDetail = async (item: KatalogSembakoItem) => {
        setSelectedSembako(item);
        setBsuRiwayat(null);
        if (isAdminBsm) return;
        try {
            const res = await SembakoService.getDetailSembakoBSU(item.sembako_id, sembakoFilterBank);
            setBsuRiwayat(res.data?.riwayat_distribusi ?? []);
        } catch {
            setBsuRiwayat([]);
        }
    };

    const handleSembakoSubmit = async (data: SembakoFormData) => {
        if (!user?.bank_id) { showNotif("Bank ID tidak ditemukan.", "error"); return; }
        setIsSubmitting(true);
        try {
            if (formMode === "add-sembako") {
                await SembakoService.addSembako(user.bank_id, {
                    nama_barang: data.nama_barang,
                    barang_id: data.barang_id,
                    nilai_poin: data.nilai_poin,
                    stok_awal: data.stok_awal,
                    created_by: user.identity_id || undefined,
                    foto: data.foto,
                });
                showNotif("Sembako berhasil ditambahkan!");
            } else if (formMode === "edit-sembako" && selectedSembako) {
                await SembakoService.editSembako(selectedSembako.sembako_id, {
                    nama_barang: data.nama_barang || undefined,
                    nilai_poin: data.nilai_poin,
                    tambah_stok: data.tambah_stok,
                    stok: data.stok,
                    updated_by: user.identity_id || undefined,
                    foto: data.foto,
                });
                showNotif("Sembako berhasil diperbarui!");
                setSelectedSembako(null);
            }
            setFormMode(null);
            fetchSembako(sembakoFilterBank, sembakoPage);
        } catch (error) {
            showNotif(getApiError(error, "Gagal menyimpan perubahan."), "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSembako = () => {
        if (!selectedSembako) return;
        showConfirm(
            "Hapus Item Sembako",
            `Yakin ingin menghapus "${selectedSembako.nama_barang}"? Tindakan ini tidak bisa dibatalkan.`,
            async () => {
                closeConfirm();
                try {
                    await SembakoService.deleteSembako(selectedSembako.sembako_id);
                    showNotif("Sembako berhasil dihapus!");
                    setSelectedSembako(null);
                    if (sembakoList.length === 1 && sembakoPage > 1) {
                        const prevPage = sembakoPage - 1;
                        setSembakoPage(prevPage);
                        fetchSembako(sembakoFilterBank, prevPage);
                    } else {
                        fetchSembako(sembakoFilterBank, sembakoPage);
                    }
                } catch (error) {
                    showNotif(getApiError(error, "Gagal menghapus."), "error");
                }
            }
        );
    };

    const distribusiColumns = useMemo(() => buildDistribusiColumns(isAdminBsi), [isAdminBsi]);
    const count = activeTab === "sampah"
        ? (sampahMeta?.total ?? filteredSampah.length)
        : (sembakoMeta?.total ?? sembakoList.length);

    return (
        <div className="katalog-page">
            {notif && <PopupNotifikasi message={notif.message} type={notif.type} onClose={() => setNotif(null)} />}
            {confirmState && (
                <PopupConfirmation
                    isOpen={confirmState.isOpen}
                    type="danger"
                    title={confirmState.title}
                    message={confirmState.message}
                    confirmText="Ya, Hapus"
                    cancelText="Batal"
                    onConfirm={confirmState.onConfirm}
                    onCancel={closeConfirm}
                />
            )}

            <div className={`katalog-content-layout ${(activeTab === "sampah" || (isAdminBsi && activeTab === "sembako")) ? "has-sidebar" : ""}`}>
                <div className="katalog-content-main">
                    <Tabs
                        tabs={[
                            { id: "sampah", label: "Katalog Sampah" },
                            { id: "sembako", label: "Katalog Sembako" },
                        ]}
                        activeTab={activeTab}
                        onChange={(id) => { setActiveTab(id as "sampah" | "sembako"); setFilterKategori("all"); }}
                        style={{ marginBottom: '14px' }}
                    />

                    <div className="katalog-desc-section" style={{ paddingTop: 0 }}>
                        <p className="katalog-desc">
                            {activeTab === "sampah"
                                ? "Daftar jenis sampah yang dapat disetor oleh nasabah ke Bank Sampah. Setiap item memiliki harga jual berupa rupiah atau poin yang ditentukan oleh masing-masing Bank Sampah."
                                : "Daftar produk kebutuhan pokok yang dapat ditukarkan oleh nasabah menggunakan poin hasil setoran sampah. Program ini mendorong nasabah untuk aktif menabung sampah."}
                        </p>

                        <div className="katalog-action-row">
                            <span className="katalog-count">{count} item</span>
                            <div style={{ display: "flex", gap: "8px" }}>
                                {(isAdminBsi || isAdminBsu || isAdminBsm) && !(activeTab === "sembako" && isViewingBSU) && (
                                    <Button icon={<FaFileExport />} color="secondary" variant="outline" size="small" isRounded disabled={isExporting} onClick={handleExport}>
                                        {isExporting ? "Mengunduh..." : "Ekspor Laporan"}
                                    </Button>
                                )}
                                {(activeTab === "sampah" ? canEdit : canEditSembako) && (
                                    <Button icon={<FaPlus />} color="secondary" size="small" isRounded
                                        onClick={() => setFormMode(activeTab === "sampah" ? "add" : "add-sembako")}>
                                        {activeTab === "sampah" ? "Tambah Katalog Sampah" : "Tambah Katalog Sembako"}
                                    </Button>
                                )}
                            </div>
                        </div>
                        <hr className="katalog-divider" />
                    </div>

                    {activeTab === "sampah" ? (
                        filteredSampah.length === 0
                            ? <div className="katalog-empty"><FaBoxOpen /><span>Tidak ada item ditemukan</span></div>
                            : <>
                                <div className="katalog-grid">
                                    {filteredSampah.map(i => <SampahCard key={i.sampah_id} item={i} onClick={() => handleViewDetail(i)} />)}
                                </div>
                                {sampahMeta && sampahMeta.total_pages > 1 && (
                                    <div style={{ display: "flex", justifyContent: "center", margin: "16px 0 0" }}>
                                        <Pagination
                                            currentPage={sampahPage}
                                            totalPages={sampahMeta.total_pages}
                                            onPageChange={(p) => { setSampahPage(p); fetchKatalog(p); }}
                                        />
                                    </div>
                                )}
                            </>
                    ) : (
                        sembakoList.length === 0
                            ? <div className="katalog-empty"><FaBasketShopping /><span>Tidak ada item ditemukan</span></div>
                            : <>
                                <div className="katalog-grid">
                                    {sembakoList.map(i => <SembakoCard key={i.sembako_id} item={i} onClick={() => handleViewSembakoDetail(i)} />)}
                                </div>
                                {sembakoMeta && sembakoMeta.total_pages > 1 && (
                                    <div style={{ display: "flex", justifyContent: "center", margin: "16px 0 0" }}>
                                        <Pagination
                                            currentPage={sembakoPage}
                                            totalPages={sembakoMeta.total_pages}
                                            onPageChange={(p) => { setSembakoPage(p); fetchSembako(sembakoFilterBank, p); }}
                                        />
                                    </div>
                                )}
                            </>
                    )}
                </div>

                {/* Filter Sampah */}
                {activeTab === "sampah" && (
                    <div className="katalog-side-col">
                        <aside className="katalog-filter-sidebar">
                            <div className="kf-group">
                                <span className="kf-group-label">Kategori Sampah</span>
                                <FilterPill
                                    options={[{ label: "Semua", value: "all" }, ...categories.map(cat => ({ label: cat.Kategori, value: cat.KategoriID }))]}
                                    activeValue={filterKategori}
                                    onChange={(v) => setFilterKategori(v)}
                                />
                            </div>
                            <div className="kf-group">
                                <span className="kf-group-label">Jenis Satuan</span>
                                <FilterPill
                                    options={SATUAN_OPTIONS}
                                    activeValue={filterSatuan}
                                    onChange={(v) => setFilterSatuan(v as "all" | "kg" | "pcs" | "liter")}
                                />
                            </div>
                            <div className="kf-group">
                                <span className="kf-group-label">Nilai Jual</span>
                                <FilterPill
                                    options={[{ label: "Semua", value: "all" }, ...rewards.map(r => ({ label: r.NamaReward, value: r.RewardID }))]}
                                    activeValue={filterReward}
                                    onChange={(v) => setFilterReward(v)}
                                />
                            </div>
                        </aside>
                    </div>
                )}

                {/* Filter Sembako BSI */}
                {activeTab === "sembako" && isAdminBsi && (
                    <div className="katalog-side-col">
                        <aside className="katalog-filter-sidebar">
                            <div className="kf-group">
                                <span className="kf-group-label">Katalog</span>
                                <FilterPill
                                    options={[{ label: "Katalog Saya", value: user?.bank_id ?? "" }]}
                                    activeValue={sembakoFilterBank}
                                    onChange={(v) => {
                                        const bankId = v as string;
                                        setSembakoFilterBank(bankId);
                                        setSembakoPage(1);
                                        setSelectedSembako(null);
                                        fetchSembako(bankId, 1);
                                    }}
                                />
                            </div>
                            {bsuList.length > 0 && (
                                <>
                                    <hr className="katalog-divider" />
                                    <div className="kf-group">
                                        <span className="kf-group-label">Unit BSU</span>
                                        <FilterPill
                                            options={bsuList.map(b => ({ label: b.NamaBank, value: b.BankID }))}
                                            activeValue={sembakoFilterBank}
                                            onChange={(v) => {
                                                const bankId = v as string;
                                                setSembakoFilterBank(bankId);
                                                setSelectedSembako(null);
                                                fetchSembako(bankId);
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                        </aside>
                    </div>
                )}
            </div>

            {/* Distribusi Section */}
            {activeTab === "sembako" && (isAdminBsi || isAdminBsu) && (
                <div className="katalog-distribusi-section">
                    <hr className="katalog-divider" style={{ marginTop: "24px", marginBottom: "24px" }} />
                    <div className="katalog-distribusi-header">
                        <h3 className="katalog-distribusi-title">Riwayat Distribusi Sembako</h3>
                        <p className="katalog-distribusi-desc">
                            {isAdminBsi
                                ? "Daftar seluruh distribusi sembako yang telah dikirimkan ke unit BSU."
                                : "Daftar seluruh distribusi sembako yang telah diterima dari BSI."}
                        </p>
                    </div>
                    <div className="katalog-distribusi-filter-row">
                        <SearchBar
                            placeholder="Cari ID distribusi atau nama..."
                            value={distribusiSearch}
                            onChange={setDistribusiSearch}
                            width="280px"
                        />
                        <FilterRange
                            from={distribusiFrom}
                            to={distribusiTo}
                            onChange={(f, t) => { setDistribusiFrom(f); setDistribusiTo(t); }}
                        />
                    </div>
                    {distribusiLoading
                        ? <div className="katalog-loading">Memuat data...</div>
                        : <Table
                            columns={distribusiColumns}
                            data={filteredDistribusi}
                            rowKey={(row) => row.disbako_id}
                            emptyMessage="Belum ada riwayat distribusi sembako."
                            onRowClick={(row) => navigate(`${isAdminBsi ? "/bsi" : "/bsu"}/distribusi-sembako/${row.disbako_id}`)}
                          />
                    }
                </div>
            )}

            {/* Modals */}
            {(formMode === "add" || formMode === "edit-item") && (
                <KatalogSampahFormModal
                    formMode={formMode}
                    categories={categories}
                    rewards={rewards}
                    initialValues={formMode === "edit-item" && selectedItem ? {
                        nama_sampah: selectedItem.nama_sampah,
                        satuan: selectedItem.satuan,
                        kategori_id: selectedItem.kategori_id,
                        reward_id: selectedItem.reward_id,
                        syarat_pemilahan: selectedItem.syarat_pemilahan,
                        photo_url: selectedItem.photo_url,
                    } : undefined}
                    isSubmitting={isSubmitting}
                    onSubmit={handleSampahSubmit}
                    onClose={() => setFormMode(null)}
                />
            )}

            {selectedItem && !formMode && (
                <KatalogSampahDetailModal
                    item={selectedItem}
                    detail={selectedItemDetail}
                    canEdit={canEdit}
                    onClose={() => { setSelectedItem(null); setSelectedItemDetail(null); }}
                    onDelete={handleDelete}
                    onEdit={() => setFormMode("edit-item")}
                />
            )}

            {(formMode === "add-sembako" || formMode === "edit-sembako") && (
                <KatalogSembakoFormModal
                    formMode={formMode}
                    initialValues={formMode === "edit-sembako" && selectedSembako ? {
                        nama_barang: selectedSembako.nama_barang,
                        nilai_poin: selectedSembako.nilai_poin,
                        photo_url: selectedSembako.photo_url,
                    } : undefined}
                    isSubmitting={isSubmitting}
                    onSubmit={handleSembakoSubmit}
                    onClose={() => setFormMode(null)}
                />
            )}

            {selectedSembako && !formMode && (
                <KatalogSembakoDetailModal
                    item={selectedSembako}
                    bsuRiwayat={bsuRiwayat}
                    canEditSembako={canEditSembako}
                    isAdminBsi={isAdminBsi}
                    isAdminBsm={isAdminBsm}
                    filterBankName={bsuList.find(b => b.BankID === sembakoFilterBank)?.NamaBank}
                    isViewingBSU={isViewingBSU}
                    onClose={() => { setSelectedSembako(null); setBsuRiwayat(null); }}
                    onDelete={handleDeleteSembako}
                    onEdit={() => setFormMode("edit-sembako")}
                />
            )}
        </div>
    );
}
