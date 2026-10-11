import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FaEye, FaEyeSlash } from 'react-icons/fa6'
import '../styles/aktivasi.css'
import Input from '../components/input'
import Button from '../components/button'
import PopupNotifikasi from '../layouts/popup-notifikasi'
import { AuthService } from '../services/auth.service'
import { useAuth } from '../contexts/AuthContext'
import ilustrationPassword from '../assets/password-bro.png'
import logo from '../assets/logo-enviroo-new.png'

type ManageMode = 'tahu-lama' | 'lupa-email' | 'lupa-otp' | 'lupa-password'

const JUDUL: Record<ManageMode, string> = {
    'tahu-lama': 'UBAH PASSWORD',
    'lupa-email': 'LUPA PASSWORD',
    'lupa-otp': 'VERIFIKASI OTP',
    'lupa-password': 'BIKIN PASSWORD BARU',
}

const TOMBOL: Record<ManageMode, string> = {
    'tahu-lama': 'SIMPAN PASSWORD',
    'lupa-email': 'KIRIM KODE OTP',
    'lupa-otp': 'VERIFIKASI OTP',
    'lupa-password': 'SIMPAN PASSWORD',
}

export default function ManagePasswordPage(){
    const navigate = useNavigate()
    const { logout, isAuthenticated } = useAuth()
    const [searchParams] = useSearchParams()

    const dariProfil = searchParams.get('from') === 'profil'

    const [mode, setMode] = useState<ManageMode>(dariProfil ? 'tahu-lama' : 'lupa-email')
    const [oldPassword, setOldPassword] = useState('')
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showOldPassword, setShowOldPassword] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [notif, setNotif] = useState('')

    const isiPasswordBaru = mode === 'tahu-lama' || mode === 'lupa-password'

    const syaratGagal = [
        password.length < 8 && 'minimal 8 karakter',
        !/[A-Z]/.test(password) && 'mengandung huruf kapital',
        !/[0-9]/.test(password) && 'mengandung angka',
    ].filter(Boolean) as string[]

    const passwordError = password.length > 0 && syaratGagal.length > 0
        ? `Password harus ${syaratGagal.join(', ')}.`
        : ''
    const confirmError = confirmPassword.length > 0 && password !== confirmPassword
        ? 'Konfirmasi password tidak cocok.'
        : ''

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMsg('')

        if (isiPasswordBaru && (syaratGagal.length > 0 || password !== confirmPassword)) {
            return
        }

        setIsLoading(true)
        try {
            if (mode === 'tahu-lama') {
                await AuthService.changePassword({
                    password_lama: oldPassword,
                    password_baru: password,
                    konfirmasi_password_baru: confirmPassword,
                })
                setNotif('Password berhasil diubah. Anda akan diarahkan ke halaman login.')
            } else if (mode === 'lupa-email') {
                await AuthService.sendEmailForgetPassword(email)
                setMode('lupa-otp')
            } else if (mode === 'lupa-otp') {
                await AuthService.verifikasiOTPForgetPassword(email, otp)
                setMode('lupa-password')
            } else {
                await AuthService.resetPassword(email, otp, password, confirmPassword)
                setNotif('Password berhasil diubah. Silakan login menggunakan password baru Anda.')
            }
        } catch (error: any) {
            setErrorMsg(error.response?.data?.error ?? 'Terjadi kesalahan, silakan coba lagi.')
        } finally {
            setIsLoading(false)
        }
    }

    return(
        <div className='aktivasi-bg'>
            {notif && (
                <PopupNotifikasi
                    message={notif}
                    type='success'
                    onClose={() => {
                        setNotif('')
                        if (isAuthenticated) logout()
                        else navigate('/', { replace: true })
                    }}
                />
            )}
            <div className="aktivasi-container">
                <div className="aktivasi-left">
                    {isiPasswordBaru ? (
                        <div className="aktivasi-syarat">
                            <span className="aktivasi-syarat-label">Syarat Password</span>
                            <ul>
                                <li>Minimal 8 karakter</li>
                                <li>Mengandung huruf kapital (A&ndash;Z)</li>
                                <li>Mengandung angka (0&ndash;9)</li>
                            </ul>
                        </div>
                    ) : (
                        <p>Lupa password lama? Masukkan <b>email akunmu yang terdaftar</b>. Sistem bakalan ngirim <b>kode OTP</b> ke email kamu agar kamu bisa lanjut ganti password</p>
                    )}
                    <img src={ilustrationPassword} alt="" className='ilustration'/>
                </div>
                <form className="aktivasi-right" onSubmit={handleSubmit}>
                    <img src={logo} alt="" className='logo'/>
                    <h3>{JUDUL[mode]}</h3>
                    {mode === 'tahu-lama' && (
                        <p>Masukkan password lama kamu, terus bikin password baru buat akun admin <b>enviroo</b> kamu.</p>
                    )}
                    {mode === 'lupa-email' && (
                        <p>Masukkan email yang kamu pakai buat masuk ke akun admin <b>enviroo</b> kamu.</p>
                    )}
                    {mode === 'lupa-otp' && (
                        <p>Kode OTP udah dikirim ke <b>{email}</b>. Cek inbox kamu ya!</p>
                    )}
                    {mode === 'lupa-password' && (
                        <p>Password ini yang bakal kamu pakai buat masuk ke akun admin <b>enviroo</b> kamu. Jangan sampai lupa lagi!</p>
                    )}

                    {errorMsg && <div className="aktivasi-error">{errorMsg}</div>}

                    {mode === 'tahu-lama' && (
                        <>
                            <Input
                                placeholder='Password Lama'
                                type={showOldPassword ? 'text' : 'password'}
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                iconRight={showOldPassword ? <FaEyeSlash /> : <FaEye />}
                                onIconRightClick={() => setShowOldPassword(v => !v)}
                                required
                                fullWidth
                                inputSize='large'
                                variant='outline'
                                color='secondary'
                            />
                            <button
                                type='button'
                                className='aktivasi-field-link'
                                onClick={() => {
                                    setErrorMsg('')
                                    setOldPassword('')
                                    setPassword('')
                                    setConfirmPassword('')
                                    setMode('lupa-email')
                                }}
                            >
                                Lupa password lama
                            </button>
                        </>
                    )}

                    {mode === 'lupa-email' && (
                        <Input
                            placeholder='Email'
                            type='email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            fullWidth
                            inputSize='large'
                            variant='outline'
                            color='secondary'
                        />
                    )}

                    {mode === 'lupa-otp' && (
                        <Input
                            placeholder='Kode OTP (6 digit)'
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                            fullWidth
                            inputSize='large'
                            variant='outline'
                            color='secondary'
                        />
                    )}

                    {isiPasswordBaru && (
                        <>
                            <Input
                                placeholder='Bikin Password Baru'
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                iconRight={showPassword ? <FaEyeSlash /> : <FaEye />}
                                onIconRightClick={() => setShowPassword(v => !v)}
                                className={passwordError ? 'input-error' : ''}
                                required
                                fullWidth
                                inputSize='large'
                                variant='outline'
                                color='secondary'
                            />
                            {passwordError && <span className="aktivasi-field-error">{passwordError}</span>}
                            <Input
                                placeholder='Konfirmasi Password Baru'
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                iconRight={showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                onIconRightClick={() => setShowConfirmPassword(v => !v)}
                                className={confirmError ? 'input-error' : ''}
                                required
                                fullWidth
                                inputSize='large'
                                variant='outline'
                                color='secondary'
                            />
                            {confirmError && <span className="aktivasi-field-error">{confirmError}</span>}
                        </>
                    )}

                    <Button
                        fullWidth
                        color='secondary'
                        variant='solid'
                        type='submit'
                        isRounded
                        size='large'
                        disabled={isLoading}
                    >
                        {isLoading ? 'MEMPROSES...' : TOMBOL[mode]}
                    </Button>

                    <p className="aktivasi-back">
                        Kembali ke halaman{' '}
                        <button type='button' onClick={() => navigate(dariProfil ? '/profil' : '/')}>
                            {dariProfil ? 'Profil' : 'Login'}
                        </button>
                    </p>
                </form>
            </div>
        </div>
    )
}
