import React, { useState, useEffect, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import Button from "../components/button";
import Input from "../components/input";
import logo from "../assets/logo-enviroo.png";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import { AuthService } from "../services/auth.service";

/* ── Memoized Hero Section ── */
const LoginHero = memo(() => (
    <div className="login-left">
        <div className="login-hero-content">
            <span className="login-hero-tag">Bank Sampah Digital</span>
            <h1 className="login-hero-title">
                Selamat datang di <span className="login-hero-brand">Enviroo</span>.
            </h1>
            <p className="login-hero-desc">
                Platform pengelolaan bank sampah dengan model hierarki multi-level yang mempermudah operasional organisasi Anda.
            </p>
            <div className="login-hero-divider"></div>
            <p className="login-hero-caption">
                Kelola · Pantau · Berdaya Bersama.
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
    const [authMode, setAuthMode] = useState<"login" | "activate" | "reactivate">("login");

    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    
    const { user, login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

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
            if (authMode === "activate") {
                // Flow Aktivasi Admin Baru
                await AuthService.aktivasiAkun({
                    user_id: email, // NIK di-bind ke state email
                    otp: otp,
                    password: newPassword
                });
                
                alert("Aktivasi berhasil! Silakan login menggunakan Email (atau NIK) dan Password Anda.");
                setAuthMode("login");
                setOtp("");
                setNewPassword("");
                setPassword("");
            } else if (authMode === "reactivate") {
                // Flow Reaktivasi Admin Lama
                await AuthService.reactivateAkun(email, otp);
                
                alert("Akun berhasil diaktifkan kembali! Silakan login menggunakan Email/NIK dan Password lama Anda.");
                setAuthMode("login");
                setOtp("");
                setNewPassword("");
                setPassword("");
            } else {
                // Flow Reguler Login Web
                await login({ email, password, platform: "web", role: "admin" });
            }
        } catch (error: any) {
            const errResponse = error.response?.data?.error;
            let errorMessage = "Terjadi kesalahan sistem.";
            
            if (authMode === "activate") {
                errorMessage = "Gagal melakukan aktivasi.";
                if (errResponse) {
                    if (errResponse.includes("'min' tag") && errResponse.includes("Password")) {
                        errorMessage = "Password terlalu pendek, minimal 8 karakter.";
                    } else {
                        errorMessage = errResponse;
                    }
                }
            } else if (authMode === "reactivate") {
                errorMessage = "Gagal mengaktifkan kembali akun.";
                if (errResponse) {
                    errorMessage = errResponse;
                }
            } else {
                errorMessage = "Gagal login, periksa kembali data Anda.";
                if (errResponse) {
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
            }
            setErrorMsg(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [email, password, otp, newPassword, login, authMode]);

    const togglePassword = useCallback(() => setShowPassword(v => !v), []);
    const toggleNewPassword = useCallback(() => setShowNewPassword(v => !v), []);
    
    const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value), []);
    const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value), []);

    return (
        <div className="login-page">
            <LoginHero />

            <div className="login-right">
                <div className="login-right-inner">
                    <img src={logo} alt="Logo Enviroo" className="login-right-logo" />
                    <div className="login-title">
                        <h2>
                            {authMode === "activate" ? "AKTIVASI AKUN"
                            : authMode === "reactivate" ? "REAKTIVASI AKUN"
                            : "LOGIN"}
                        </h2>
                        <p>
                            {authMode === "activate" 
                                ? "Silakan lengkapi data berikut untuk mengaktifkan akun Admin baru"
                            : authMode === "reactivate"
                                ? "Silakan masukkan NIK dan Kode OTP untuk mengaktifkan kembali akun Anda"
                                : "Silahkan login ke akun Administrator Anda yang sudah terdaftar"}
                        </p>
                    </div>

                    <form className="login-form" onSubmit={handleLogin}>
                        {errorMsg && <div className="login-error">{errorMsg}</div>}
                        
                        {authMode === "activate" && (
                            <>
                                <Input
                                    variant="solid"
                                    color="primary"
                                    inputSize="large"
                                    fullWidth
                                    iconLeft={<FaEnvelope />}
                                    type="text"
                                    placeholder="NIK"
                                    value={email}
                                    onChange={handleEmailChange}
                                    required
                                />
                                <Input
                                    variant="solid"
                                    color="primary"
                                    inputSize="large"
                                    iconLeft={<FaLock />}
                                    type="text"
                                    placeholder="Kode OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                />
                                <Input
                                    variant="solid"
                                    color="primary"
                                    inputSize="large"
                                    iconLeft={<FaLock />}
                                    iconRight={showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                    onIconRightClick={toggleNewPassword}
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="Password Baru"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />

                                <Button type="submit" color="neon" isRounded fullWidth size="large" disabled={isLoading} style={{ marginTop: '20px' }}>
                                    {isLoading ? "MEMPROSES..." : "AKTIVASI AKUN"}
                                </Button>

                                <div className="login-forgot-wrapper" style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                                    <span style={{ fontSize: '11px', color: '#5a7a68' }}>
                                        Kembali ke halaman{' '}
                                        <span 
                                            onClick={() => setAuthMode("login")}
                                            style={{ color: '#94DF0C', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}
                                        >
                                            Login
                                        </span>
                                    </span>
                                </div>
                            </>
                        )}
                        
                        {authMode === "reactivate" && (
                            <>
                                <Input
                                    variant="solid"
                                    color="primary"
                                    inputSize="large"
                                    fullWidth
                                    iconLeft={<FaEnvelope />}
                                    type="text"
                                    placeholder="NIK"
                                    value={email}
                                    onChange={handleEmailChange}
                                    required
                                />
                                <Input
                                    variant="solid"
                                    color="primary"
                                    inputSize="large"
                                    iconLeft={<FaLock />}
                                    type="text"
                                    placeholder="Kode OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                />

                                <Button type="submit" color="neon" isRounded fullWidth size="large" disabled={isLoading} style={{ marginTop: '20px' }}>
                                    {isLoading ? "MEMPROSES..." : "AKTIFKAN KEMBALI"}
                                </Button>

                                <div className="login-forgot-wrapper" style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                                    <span style={{ fontSize: '11px', color: '#5a7a68' }}>
                                        Kembali ke halaman{' '}
                                        <span 
                                            onClick={() => setAuthMode("login")}
                                            style={{ color: '#94DF0C', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}
                                        >
                                            Login
                                        </span>
                                    </span>
                                </div>
                            </>
                        )}

                        {authMode === "login" && (
                            <>
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
                                    <a href="#" className="login-forgot" style={{ margin: 0 }}>Lupa kata sandi?</a>
                                </div>

                                <Button type="submit" color="neon" isRounded fullWidth size="large" disabled={isLoading} style={{ marginTop: '5px' }}>
                                    {isLoading ? "MASUK..." : "MASUK"}
                                </Button>

                                <span style={{ fontSize: '11px', color: '#5a7a68', justifyContent: 'center', display: 'flex', marginTop: '10px'}}>
                                    Aktivasi akun? {' '}
                                    <span   
                                        onClick={() => setAuthMode("activate")}
                                        style={{ color: '#94DF0C', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', margin: '0 5px'}}
                                    >
                                        Baru
                                    </span>
                                    {' | '}
                                    <span   
                                        onClick={() => setAuthMode("reactivate")}
                                        style={{ color: '#94DF0C', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', marginLeft: '5px'}}
                                    >
                                        Lama
                                    </span>
                                </span>
                            </>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}