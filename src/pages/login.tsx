import React, { useState, useEffect, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import Button from "../components/button";
import Input from "../components/input";
import logo from "../assets/logo-enviroo.png";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import { AuthService } from "../services/auth.service";
import PopupNotifikasi from "../layouts/popup-notifikasi";

/* ── Memoized Hero Section ── */
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
    const [authMode, setAuthMode] = useState<"login" | "activate" | "activate-password" | "reactivate" | "forgot-email" | "forgot-otp" | "forgot-reset">("login");

    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [notif, setNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);
    
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
                // Step 1: verify NIK + OTP with empty password
                // Backend returns 400 "Password wajib diisi..." if first-time activation
                await AuthService.aktivasiAkun({ user_id: email, otp: otp, password: "" });
                // Password was already set — activation complete
                setNotif({ message: "Aktivasi berhasil! Silakan login menggunakan Email dan Password Anda.", type: "success" });
                setAuthMode("login");
                setEmail(""); setOtp(""); setNewPassword(""); setConfirmPassword(""); setPassword("");
            } else if (authMode === "activate-password") {
                if (newPassword !== confirmPassword) {
                    setErrorMsg("Konfirmasi password tidak cocok.");
                    return;
                }
                await AuthService.aktivasiAkun({ user_id: email, otp: otp, password: newPassword });
                setNotif({ message: "Aktivasi berhasil! Silakan login menggunakan Email dan Password Anda.", type: "success" });
                setAuthMode("login");
                setEmail(""); setOtp(""); setNewPassword(""); setConfirmPassword(""); setPassword("");
            } else if (authMode === "reactivate") {
                await AuthService.reactivateAkun(email, otp);
                setNotif({ message: "Akun berhasil diaktifkan kembali! Silakan login menggunakan Email/NIK dan Password lama Anda.", type: "success" });
                setAuthMode("login");
                setEmail("");
                setOtp("");
                setNewPassword("");
                setPassword("");
            } else if (authMode === "forgot-email") {
                await AuthService.sendEmailForgetPassword(email);
                setNotif({ message: "Kode OTP telah dikirim ke email Anda.", type: "success" });
                setAuthMode("forgot-otp");
            } else if (authMode === "forgot-otp") {
                await AuthService.verifikasiOTPForgetPassword(email, otp);
                setAuthMode("forgot-reset");
            } else if (authMode === "forgot-reset") {
                if (newPassword !== confirmPassword) {
                    setErrorMsg("Konfirmasi password baru tidak cocok.");
                    return;
                }
                await AuthService.resetPassword(email, otp, newPassword, confirmPassword);
                setNotif({ message: "Password berhasil diubah. Silakan login menggunakan password baru Anda.", type: "success" });
                setAuthMode("login");
                setEmail("");
                setOtp("");
                setNewPassword("");
                setConfirmPassword("");
                setPassword("");
            } else {
                await login({ email, password, platform: "web", role: "admin" });
            }
        } catch (error: any) {
            const errResponse = error.response?.data?.error;
            let errorMessage = "Terjadi kesalahan sistem.";

            if (authMode === "activate") {
                // "Password wajib diisi..." means first-time activation — need password step
                if (errResponse?.includes("Password wajib diisi")) {
                    setErrorMsg("");
                    setAuthMode("activate-password");
                    return;
                }
                errorMessage = errResponse ?? "Gagal melakukan verifikasi. Periksa NIK dan OTP Anda.";
            } else if (authMode === "activate-password") {
                errorMessage = errResponse ?? "Gagal melakukan aktivasi.";
            } else if (authMode === "reactivate") {
                errorMessage = errResponse ?? "Gagal mengaktifkan kembali akun.";
            } else if (authMode === "forgot-email") {
                errorMessage = errResponse ?? "Gagal mengirim email OTP.";
            } else if (authMode === "forgot-otp") {
                errorMessage = errResponse ?? "Verifikasi OTP gagal.";
            } else if (authMode === "forgot-reset") {
                errorMessage = errResponse ?? "Gagal mereset password.";
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
    }, [email, password, otp, newPassword, confirmPassword, login, authMode]);

    const togglePassword = useCallback(() => setShowPassword(v => !v), []);
    const toggleNewPassword = useCallback(() => setShowNewPassword(v => !v), []);
    const toggleConfirmPassword = useCallback(() => setShowConfirmPassword(v => !v), []);
    
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
                        <h2>
                            {authMode === "activate" ? "AKTIVASI AKUN"
                            : authMode === "activate-password" ? "BUAT PASSWORD"
                            : authMode === "reactivate" ? "REAKTIVASI AKUN"
                            : authMode === "forgot-email" ? "LUPA KATA SANDI"
                            : authMode === "forgot-otp" ? "VERIFIKASI OTP"
                            : authMode === "forgot-reset" ? "RESET PASSWORD"
                            : "LOGIN"}
                        </h2>
                        <p>
                            {authMode === "activate"
                                ? "Masukkan NIK dan Kode OTP untuk verifikasi akun Anda"
                            : authMode === "activate-password"
                                ? "Buat password baru untuk melengkapi aktivasi akun Anda"
                            : authMode === "reactivate"
                                ? "Silakan masukkan NIK dan Kode OTP untuk mengaktifkan kembali akun Anda"
                            : authMode === "forgot-email"
                                ? "Masukkan email akun Anda untuk menerima kode OTP"
                            : authMode === "forgot-otp"
                                ? "Masukkan kode OTP yang telah dikirim ke email Anda"
                            : authMode === "forgot-reset"
                                ? "Masukkan password baru untuk akun Anda"
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
                                    fullWidth
                                    iconLeft={<FaLock />}
                                    type="text"
                                    placeholder="Kode OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                />

                                <Button type="submit" color="neon" isRounded fullWidth size="large" disabled={isLoading} style={{ marginTop: '20px' }}>
                                    {isLoading ? "MEMVERIFIKASI..." : "VERIFIKASI"}
                                </Button>

                                <div className="login-forgot-wrapper" style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                                    <span style={{ fontSize: '11px', color: '#5a7a68' }}>
                                        Kembali ke halaman{' '}
                                        <span
                                            onClick={() => { setErrorMsg(""); setAuthMode("login"); }}
                                            style={{ color: '#94DF0C', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}
                                        >
                                            Login
                                        </span>
                                    </span>
                                </div>
                            </>
                        )}

                        {authMode === "activate-password" && (
                            <>
                                <Input
                                    variant="solid"
                                    color="primary"
                                    inputSize="large"
                                    fullWidth
                                    iconLeft={<FaLock />}
                                    iconRight={showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                    onIconRightClick={toggleNewPassword}
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="Password Baru"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                                <Input
                                    variant="solid"
                                    color="primary"
                                    inputSize="large"
                                    fullWidth
                                    iconLeft={<FaLock />}
                                    iconRight={showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    onIconRightClick={toggleConfirmPassword}
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Konfirmasi Password Baru"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />

                                <Button type="submit" color="neon" isRounded fullWidth size="large" disabled={isLoading} style={{ marginTop: '20px' }}>
                                    {isLoading ? "MEMPROSES..." : "AKTIVASI AKUN"}
                                </Button>

                                <div className="login-forgot-wrapper" style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                                    <span style={{ fontSize: '11px', color: '#5a7a68' }}>
                                        <span
                                            onClick={() => { setErrorMsg(""); setNewPassword(""); setConfirmPassword(""); setAuthMode("activate"); }}
                                            style={{ color: '#94DF0C', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            ← Kembali
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

                        {authMode === "forgot-email" && (
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

                                <Button type="submit" color="neon" isRounded fullWidth size="large" disabled={isLoading} style={{ marginTop: '20px' }}>
                                    {isLoading ? "MENGIRIM..." : "KIRIM KODE OTP"}
                                </Button>

                                <div className="login-forgot-wrapper" style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                                    <span style={{ fontSize: '11px', color: '#5a7a68' }}>
                                        Kembali ke halaman{' '}
                                        <span
                                            onClick={() => { setErrorMsg(""); setAuthMode("login"); }}
                                            style={{ color: '#94DF0C', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            Login
                                        </span>
                                    </span>
                                </div>
                            </>
                        )}

                        {authMode === "forgot-otp" && (
                            <>
                                <Input
                                    variant="solid"
                                    color="primary"
                                    inputSize="large"
                                    fullWidth
                                    iconLeft={<FaLock />}
                                    type="text"
                                    placeholder="Kode OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                />

                                <Button type="submit" color="neon" isRounded fullWidth size="large" disabled={isLoading} style={{ marginTop: '20px' }}>
                                    {isLoading ? "MEMVERIFIKASI..." : "VERIFIKASI OTP"}
                                </Button>

                                <div className="login-forgot-wrapper" style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                                    <span style={{ fontSize: '11px', color: '#5a7a68' }}>
                                        Belum terima OTP?{' '}
                                        <span
                                            onClick={() => { setErrorMsg(""); setOtp(""); setAuthMode("forgot-email"); }}
                                            style={{ color: '#94DF0C', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            Kirim ulang
                                        </span>
                                    </span>
                                </div>
                            </>
                        )}

                        {authMode === "forgot-reset" && (
                            <>
                                <Input
                                    variant="solid"
                                    color="primary"
                                    inputSize="large"
                                    fullWidth
                                    iconLeft={<FaLock />}
                                    iconRight={showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                    onIconRightClick={toggleNewPassword}
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="Password Baru"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                                <Input
                                    variant="solid"
                                    color="primary"
                                    inputSize="large"
                                    fullWidth
                                    iconLeft={<FaLock />}
                                    iconRight={showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    onIconRightClick={toggleConfirmPassword}
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Konfirmasi Password Baru"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />

                                <Button type="submit" color="neon" isRounded fullWidth size="large" disabled={isLoading} style={{ marginTop: '20px' }}>
                                    {isLoading ? "MENYIMPAN..." : "RESET PASSWORD"}
                                </Button>

                                <div className="login-forgot-wrapper" style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                                    <span style={{ fontSize: '11px', color: '#5a7a68' }}>
                                        Kembali ke halaman{' '}
                                        <span
                                            onClick={() => { setErrorMsg(""); setAuthMode("login"); }}
                                            style={{ color: '#94DF0C', fontWeight: 600, cursor: 'pointer' }}
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
                                    <span
                                        className="login-forgot"
                                        style={{ margin: 0, cursor: 'pointer' }}
                                        onClick={() => { setErrorMsg(""); setEmail(""); setOtp(""); setNewPassword(""); setConfirmPassword(""); setAuthMode("forgot-email"); }}
                                    >
                                        Lupa kata sandi?
                                    </span>
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