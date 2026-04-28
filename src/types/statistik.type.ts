export interface BankSampahStatistik {
    bsi: number;
    bsm: number;
    bsu: number;
}

export interface GetBankSampahStatistikResponse {
    message: string;
    data: BankSampahStatistik;
}
