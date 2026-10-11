import React, { useState, useEffect, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import Button from "../components/button";
import Input from "../components/input";
import logo from "../assets/logo-enviroo.png";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import { AUTH_NOTICE_KEY } from "../services/api";
import PopupNotifikasi from "../layouts/popup-notifikasi";

const LoginHero = memo(() => (
    <div className="login-left">
        <div className="login-hero-content">
            <span className="login-hero-tag">Bank Sampah Digital</span>
            <h1 className="login-hero-title">
                Selamat datang di <span className="login-hero-brand">Enviroo</span>
            </h1>
            <p className="login-hero-desc">
                Platform pengelolaan bank sampah dengan model hierarki multi-level yang mempermudah operasional organisasi Anda.
            </p>
        </div>
    </div>
));

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [notif, setNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const { user, login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const prevBg = document.body.style.backgroundColor;
        document.body.style.backgroundColor = "#013236";
        return () => {
            document.body.style.backgroundColor = prevBg;
        };
    }, []);

    useEffect(() => {
        const notice = sessionStorage.getItem(AUTH_NOTICE_KEY);
        if (notice) {
            sessionStorage.removeItem(AUTH_NOTICE_KEY);
            setNotif({ message: notice, type: "error" });
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated && user) {
            const role = user.role?.toLowerCase() || "";
            if (role === "superadmin") {
                navigate("/superadmin", { replace: true });
            } else if (role === "admin_bsi") {
                navigate("/bsi", { replace: true });
            } else if (role === "admin_bsu") {
                navigate("/bsu", { replace: true });
            } else if (role === "admin_bsm") {
                navigate("/bsm", { replace: true });
            } else {
                navigate("/unauthorized", { replace: true });
            }
        }
    }, [isAuthenticated, user, navigate]);

    const handleLogin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setIsLoading(true);
        try {
            await login({ email, password, platform: "web", role: "admin" });
        } catch (error: any) {
            const errResponse = error.response?.data?.error;
            let errorMessage = "Gagal login, periksa kembali data Anda.";

            if (typeof errResponse === "string") {
                if (errResponse.includes("'min' tag") && errResponse.includes("Password")) {
                    errorMessage = "Password terlalu pendek, minimal 8 karakter.";
                } else if (errResponse.includes("'email' tag") && errResponse.includes("Email")) {
                    errorMessage = "Format email tidak valid.";
                } else if (errResponse.includes("required")) {
                    errorMessage = "Identitas dan password wajib diisi.";
                } else {
                    errorMessage = errResponse;
                }
            }
            setErrorMsg(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [email, password, login]);

    const togglePassword = useCallback(() => setShowPassword(v => !v), []);

    const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value), []);
    const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value), []);

    return (
        <div className="login-page">
            {notif && (
                <PopupNotifikasi
                    message={notif.message}
                    type={notif.type}
                    onClose={() => setNotif(null)}
                />
            )}
            <LoginHero />

            <div className="login-right">
                <div className="login-right-inner">
                    <img src={logo} alt="Logo Enviroo" className="login-right-logo" />
                    <div className="login-title">
                        <h2>LOGIN</h2>
                        <p>Silahkan login ke akun Administrator Anda yang sudah terdaftar</p>
                    </div>

                    <form className="login-form" onSubmit={handleLogin}>
                        {errorMsg && <div className="login-error">{errorMsg}</div>}

                        <Input
                            variant="solid"
                            color="primary"
                            inputSize="large"
                            fullWidth
                            iconLeft={<FaEnvelope />}
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={handleEmailChange}
                            required
                        />

                        <Input
                            variant="solid"
                            color="primary"
                            inputSize="large"
                            fullWidth
                            iconLeft={<FaLock />}
                            iconRight={showPassword ? <FaEyeSlash /> : <FaEye />}
                            onIconRightClick={togglePassword}
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={handlePasswordChange}
                            required
                        />

                        <div className="login-forgot-wrapper" style={{ display: 'flex', justifyContent: 'end', alignItems: 'center', marginTop: '10px' }}>
                            <span
                                className="login-forgot"
                                style={{ margin: 0, cursor: 'pointer' }}
                                onClick={() => navigate("/manage-password?from=login")}
                            >
                                Lupa kata sandi?
                            </span>
                        </div>

                        <Button type="submit" color="neon" isRounded fullWidth size="large" disabled={isLoading} style={{ marginTop: '5px' }}>
                            {isLoading ? "MASUK..." : "MASUK"}
                        </Button>

                        <span style={{ fontSize: '11px', color: '#5a7a68', justifyContent: 'center', display: 'flex', marginTop: '10px'}}>
                            Belum bisa login karena akun belum aktif?{' '}
                            <span
                                onClick={() => navigate("/aktivasi")}
                                style={{ color: '#94DF0C', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', marginLeft: '5px'}}
                            >
                                Aktivasi di sini
                            </span>
                        </span>
                    </form>
                </div>
            </div>
        </div>
    );
}
