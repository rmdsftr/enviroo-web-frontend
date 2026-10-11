export const HARI_OPTIONS = [
    { label: "Senin",  value: "senin"  }, { label: "Selasa", value: "selasa" },
    { label: "Rabu",   value: "rabu"   }, { label: "Kamis",  value: "kamis"  },
    { label: "Jumat",  value: "jumat"  }, { label: "Sabtu",  value: "sabtu"  },
    { label: "Minggu", value: "minggu" },
];

export const MINGGU_OPTIONS = [
    { label: "Minggu ke-1", value: "1" }, { label: "Minggu ke-2", value: "2" },
    { label: "Minggu ke-3", value: "3" }, { label: "Minggu ke-4", value: "4" },
    { label: "Minggu ke-5", value: "5" },
];

export const WEEKDAYS = ["senin", "selasa", "rabu", "kamis", "jumat"];

export const ALL_WEEKS = ["1", "2", "3", "4", "5"];

export const HARI_DISPLAY: Record<string, string> = {
    senin: "Senin", selasa: "Selasa", rabu: "Rabu",
    kamis: "Kamis", jumat: "Jumat", sabtu: "Sabtu", minggu: "Minggu",
};

export const HARI_ORDER: Record<string, number> = {
    senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, sabtu: 6, minggu: 7,
};
