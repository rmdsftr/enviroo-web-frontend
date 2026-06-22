import { useState, useEffect, useRef, useCallback } from "react";
import { UsersService } from "../services/users.service";
import { BsiService } from "../services/bsi.service";
import { LokasiService } from "../services/lokasi.service";
import type { NonAdminUser } from "../types/users.type";
import type { Kecamatan, Kelurahan } from "../types/lokasi.type";

interface Props {
    step: 1 | 2;
    isBsu: boolean;
    isAdminBsi: boolean;
}

export function useRegisBankData({ step, isBsu, isAdminBsi }: Props) {
    // ── Form fields ──
    const [nama, setNama] = useState("");
    const [deskripsi, setDeskripsi] = useState("");
    const [provinsi, setProvinsi] = useState("");
    const [kota, setKota] = useState("");
    const [kecamatan, setKecamatan] = useState("");
    const [kelurahan, setKelurahan] = useState("");
    const [alamat, setAlamat] = useState("");
    const [foto, setFoto] = useState<File | null>(null);
    const [fotoPreview, setFotoPreview] = useState<string | null>(null);
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [dragging, setDragging] = useState(false);
    const [afiliasiBsi, setAfiliasiBsi] = useState("");
    const [geocodedPos, setGeocodedPos] = useState<[number, number] | null>(null);
    const [mounted, setMounted] = useState(false);

    // ── Location data ──
    const [kecamatanData, setKecamatanData] = useState<Kecamatan[]>([]);
    const [kelurahanData, setKelurahanData] = useState<Kelurahan[]>([]);
    const [listBsi, setListBsi] = useState<{ label: string; value: string }[]>([]);

    // ── Admin selection ──
    const [availableAdmins, setAvailableAdmins] = useState<NonAdminUser[]>([]);
    const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const listProvinsi = [{ label: "Sumatera Barat", value: "Sumatera Barat" }];
    const listKota = [{ label: "Padang", value: "Padang" }];
    const listKecamatanOptions = kecamatanData.map((k) => ({ label: k.kecamatan, value: String(k.id_kecamatan) }));
    const listKelurahanOptions = kelurahanData.map((k) => ({ label: k.kelurahan, value: String(k.id_kelurahan) }));

    // ── Effects ──
    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        LokasiService.getAllKecamatan()
            .then((res) => setKecamatanData(Array.isArray(res.data) ? res.data : []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (step === 2 && availableAdmins.length === 0) {
            UsersService.getNonAdminUsers()
                .then((res) => setAvailableAdmins(res.data || []))
                .catch((err) => console.error("Failed to fetch available admins:", err));
        }
    }, [step, availableAdmins.length]);

    useEffect(() => {
        if (isBsu && !isAdminBsi) {
            BsiService.getBsi()
                .then((res) => {
                    setListBsi((res.data || []).map((b) => ({ label: b.NamaBank, value: b.BankID })));
                })
                .catch((err) => console.error("Gagal mendapatkan list BSI:", err));
        }
    }, [isBsu, isAdminBsi]);

    useEffect(() => {
        if (!kecamatan) return;
        const kecamatanLabel = kecamatanData.find((k) => String(k.id_kecamatan) === kecamatan)?.kecamatan ?? "";
        if (!kecamatanLabel) return;
        const kelurahanLabel = kelurahanData.find((k) => String(k.id_kelurahan) === kelurahan)?.kelurahan ?? "";
        const query = [kelurahanLabel, kecamatanLabel, "Padang", "Sumatera Barat", "Indonesia"]
            .filter(Boolean).join(", ");
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=id`,
                    { headers: { "Accept-Language": "id", "User-Agent": "enviroo-web/1.0" } }
                );
                const data = await res.json();
                if (data?.[0]) {
                    const lat = parseFloat(data[0].lat);
                    const lng = parseFloat(data[0].lon);
                    setLatitude(lat);
                    setLongitude(lng);
                    setGeocodedPos([lat, lng]);
                }
            } catch {}
        }, 300);
        return () => clearTimeout(timer);
    }, [kecamatan, kelurahan, kecamatanData, kelurahanData]);

    // ── Handlers ──
    const handleProvinsiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setProvinsi(e.target.value);
        setKota(""); setKecamatan(""); setKelurahan(""); setKelurahanData([]);
    };

    const handleKotaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setKota(e.target.value);
        setKecamatan(""); setKelurahan(""); setKelurahanData([]);
    };

    const handleKecamatanChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setKecamatan(id);
        setKelurahan(""); setKelurahanData([]);
        if (!id) return;
        try {
            const res = await LokasiService.getKelurahanByKecamatan(parseInt(id));
            setKelurahanData(Array.isArray(res.data) ? res.data : []);
        } catch { setKelurahanData([]); }
    };

    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) return;
        setFoto(file);
        const reader = new FileReader();
        reader.onloadend = () => setFotoPreview(reader.result as string);
        reader.readAsDataURL(file);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const removeFoto = () => {
        setFoto(null);
        setFotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleLocationSelect = async (lat: number, lng: number) => {
        setLatitude(lat);
        setLongitude(lng);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                { headers: { "Accept-Language": "id", "User-Agent": "enviroo-web/1.0" } }
            );
            const data = await res.json();
            if (data?.address) {
                const { road, house_number } = data.address;
                const streetAddress = road
                    ? (house_number ? `${road} No. ${house_number}` : road)
                    : (data.display_name?.split(",")[0]?.trim() ?? "");
                if (streetAddress) setAlamat(streetAddress);
            }
        } catch {}
    };

    const toggleAdmin = (id: string) => {
        setSelectedAdmins((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
    };

    const toggleAllAdmins = () => {
        if (selectedAdmins.length > 0 && selectedAdmins.length === availableAdmins.length) {
            setSelectedAdmins([]);
        } else {
            setSelectedAdmins(availableAdmins.map((a) => a.UserID));
        }
    };

    const refreshAvailableAdmins = async () => {
        const res = await UsersService.getNonAdminUsers();
        setAvailableAdmins(res.data || []);
    };

    return {
        // form fields
        nama, setNama,
        deskripsi, setDeskripsi,
        provinsi, kota,
        kecamatan, setKecamatan,
        kelurahan, setKelurahan,
        alamat, setAlamat,
        foto, fotoPreview,
        latitude, longitude,
        dragging, setDragging,
        afiliasiBsi, setAfiliasiBsi,
        geocodedPos, mounted,
        // location data
        listProvinsi, listKota, listBsi,
        listKecamatanOptions, listKelurahanOptions,
        // admin selection
        availableAdmins, selectedAdmins,
        // ref
        fileInputRef,
        // handlers
        handleProvinsiChange, handleKotaChange, handleKecamatanChange,
        handleFile, handleFileChange, handleDrop, removeFoto,
        handleLocationSelect,
        toggleAdmin, toggleAllAdmins,
        refreshAvailableAdmins,
    };
}
