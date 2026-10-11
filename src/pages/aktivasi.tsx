import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash } from 'react-icons/fa6'
import '../styles/aktivasi.css'
import Input from '../components/input'
import Button from '../components/button'
import PopupNotifikasi from '../layouts/popup-notifikasi'
import { AuthService } from '../services/auth.service'
import ilustrationOtp from '../assets/email-bro.png'
import ilustrationPassword from '../assets/password-bro.png'
import logo from '../assets/logo-enviroo-new.png'

type AktivasiMode = 'otp' | 'password'

export default function AktivasiPage(){
    const navigate = useNavigate()
    const [mode, setMode] = useState<AktivasiMode>('otp')
    const [userId, setUserId] = useState('')
    const [otp, setOtp] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [notif, setNotif] = useState('')

    const isPassword = mode === 'password'

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

        if (isPassword && (syaratGagal.length > 0 || password !== confirmPassword)) {
            return
        }

        setIsLoading(true)
        try {
            await AuthService.aktivasiAkun({
                user_id: userId,
                otp: otp,
                password: isPassword ? password : '',
                platform: 'web',
            })
            setNotif('Aktivasi berhasil! Silakan login menggunakan Email dan Password Anda.')
        } catch (error: any) {
            const data = error.response?.data
            if (!isPassword && data?.code === 'PASSWORD_REQUIRED') {
                setMode('password')
                return
            }
            setErrorMsg(data?.error ?? 'Gagal melakukan aktivasi. Periksa kembali data Anda.')
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
                        navigate('/', { replace: true })
                    }}
                />
            )}
            <div className="aktivasi-container">
                <div className="aktivasi-left">
                    {isPassword ? (
                        <div className="aktivasi-syarat">
                            <span className="aktivasi-syarat-label">Syarat Password</span>
                            <ul>
                                <li>Minimal 8 karakter</li>
                                <li>Mengandung huruf kapital (A&ndash;Z)</li>
                                <li>Mengandung angka (0&ndash;9)</li>
                            </ul>
                        </div>
                    ) : (
                        <p>Untuk melakukan aktivasi, isi <b>ID Pengguna</b> yang udah didaftarin admin dan <b>kode OTP</b> yang dikirim ke email kamu, ya!</p>
                    )}
                    <img src={isPassword ? ilustrationPassword : ilustrationOtp} alt="" className='ilustration'/>
                </div>
                <form className="aktivasi-right" onSubmit={handleSubmit}>
                    <img src={logo} alt="" className='logo'/>
                    <h3>{isPassword ? 'BUAT PASSWORD' : 'AKTIVASI AKUN'}</h3>
                    {isPassword ? (
                        <p>Password ini yang bakal kamu pakai buat masuk ke akun admin <b>enviroo</b> kamu. Jangan sampai lupa!</p>
                    ) : (
                        <p>Aktivasi pada aplikasi web <b>enviroo</b> hanya bisa untuk admin bank sampah, ya!</p>
                    )}

                    {errorMsg && <div className="aktivasi-error">{errorMsg}</div>}

                    {isPassword ? (
                        <>
                            <Input
                                placeholder='Bikin password baru'
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
                                placeholder='Konfirmasi password baru'
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
                    ) : (
                        <>
                            <Input
                                placeholder='ID Pengguna'
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                required
                                fullWidth
                                inputSize='large'
                                variant='outline'
                                color='secondary'
                            />
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
                        {isLoading ? 'MEMPROSES...' : 'AKTIVASI'}
                    </Button>

                    <p className="aktivasi-back">
                        Kembali ke halaman{' '}
                        <button type='button' onClick={() => navigate('/')}>Login</button>
                    </p>
                </form>
            </div>
        </div>
    )
}
