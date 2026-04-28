export interface LoginRequest {
  email: string;
  password: string;
  platform: string;
  role: string;
}

export interface UserData {
  user_id: string;
  nama: string;
  email: string;
  role: string;
  bank_id: string;
  identity_id: string;
  access_token: string;
  refresh_token: string;
}

export interface LoginResponse {
  message: string;
  data: UserData;
}

export interface AktivasiPayload {
  user_id: string;
  otp: string;
  password?: string;
}
export interface ReactivateNasabahResponse {
  message: string;
  data: {
    aktivasi_id: string;
    otp: string;
    expired_at: string;
  };
}
