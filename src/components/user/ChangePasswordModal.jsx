import { useState } from 'react'
import BaseModal from '../common/BaseModal'
import { useLanguage } from '../../contexts/LanguageContext'
import ApiService from '../../services/api'

function ChangePasswordModal({ onClose, userEmail }) {
    const { t } = useLanguage()

    // Wizard State
    const [step, setStep] = useState(1) // 1: Old Password, 2: OTP, 3: New Password

    // Form Data
    const [oldPassword, setOldPassword] = useState('')
    const [otp, setOtp] = useState(['', '', '', '', '', '']) // Array for 6 digits
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // UI State
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Step 1: Handle Old Password Submit
    const handleOldPasswordSubmit = (e) => {
        e.preventDefault()
        setError('')
        if (!oldPassword) {
            setError('Please enter your current password')
            return
        }
        // Move to OTP step and send OTP
        setStep(2)
        sendOTP()
    }

    // Step 2: Send OTP
    const sendOTP = async () => {
        setIsLoading(true)
        setMessage('')
        setError('')
        try {
            await ApiService.resendOTP(userEmail)
            setMessage(t('otpSent'))
        } catch (err) {
            console.error(err)
            setError(err.message || 'Failed to send OTP')
        } finally {
            setIsLoading(false)
        }
    }

    // Handle OTP Input Change
    const handleOtpChange = (element, index) => {
        if (isNaN(element.value)) return false

        const newOtp = [...otp]
        newOtp[index] = element.value
        setOtp(newOtp)

        // Focus next input
        if (element.nextSibling && element.value !== '') {
            element.nextSibling.focus()
        }
    }

    const handleOtpKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            // Focus previous input on backspace if current is empty
            const inputs = e.target.parentNode.children;
            inputs[index - 1].focus();
        }
    }

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault()
        setError('')
        const otpCode = otp.join('')
        if (otpCode.length !== 6) {
            setError('Please enter the full 6-digit code')
            return
        }

        setIsLoading(true)
        try {
            // Verify OTP before moving to next step
            await ApiService.verifyOTP(userEmail, otpCode)
            setStep(3)
            setMessage('')
        } catch (err) {
            console.error(err)
            setError(err.message || 'Invalid OTP')
        } finally {
            setIsLoading(false)
        }
    }

    // Step 3: Change Password
    const handleChangePassword = async (e) => {
        e.preventDefault()
        setError('')
        setMessage('')

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long')
            return
        }

        setIsLoading(true)
        try {
            const otpCode = otp.join('')
            await ApiService.changePassword(userEmail, otpCode, oldPassword, newPassword, confirmPassword)
            setMessage(t('passwordChanged'))

            // Close modal after success delay
            setTimeout(() => {
                onClose()
            }, 2000)
        } catch (err) {
            console.error(err)
            setError(err.message || 'Failed to change password')
        } finally {
            setIsLoading(false)
        }
    }

    // Render Logic
    return (
        <BaseModal title={t('changePassword')} onClose={onClose}>
            <div style={{ padding: '20px' }}>
                {/* Progress Indicators */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', gap: '10px' }}>
                    {[1, 2, 3].map(s => (
                        <div key={s} style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: step >= s ? 'var(--primary-color)' : 'var(--border-color)',
                            transition: 'background 0.3s'
                        }} />
                    ))}
                </div>

                {/* Step 1: Old Password */}
                {step === 1 && (
                    <form onSubmit={handleOldPasswordSubmit}>
                        <p style={{ marginBottom: '15px', color: 'var(--text-secondary)' }}>
                            {t('enterOldPassword')}
                        </p>
                        <div style={{ marginBottom: '15px' }}>
                            <input
                                type="password"
                                placeholder={t('currentPassword')}
                                value={oldPassword}
                                onChange={e => setOldPassword(e.target.value)}
                                autoFocus
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '16px'
                                }}
                            />
                        </div>
                        <button
                            type="submit"
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            {t('next')}
                        </button>
                    </form>
                )}

                {/* Step 2: OTP Entry */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOTP}>
                        <p style={{ marginBottom: '15px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                            {t('enterOtp')} <br /><strong>{userEmail}</strong>
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                            {otp.map((data, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength="1"
                                    value={data}
                                    onChange={e => handleOtpChange(e.target, index)}
                                    onKeyDown={e => handleOtpKeyDown(e, index)}
                                    onFocus={e => e.target.select()}
                                    style={{
                                        width: '40px',
                                        height: '50px',
                                        fontSize: '20px',
                                        textAlign: 'center',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            ))}
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                opacity: isLoading ? 0.7 : 1
                            }}
                        >
                            {isLoading ? t('verifying') : t('verifyCode')}
                        </button>
                        <div style={{ marginTop: '15px', textAlign: 'center' }}>
                            <button
                                type="button"
                                onClick={sendOTP}
                                disabled={isLoading}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary-color)',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                {t('resend')}
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 3: New Password */}
                {step === 3 && (
                    <form onSubmit={handleChangePassword}>
                        <p style={{ marginBottom: '15px', color: 'var(--text-secondary)' }}>
                            {t('enterNewPassword')}
                        </p>
                        <div style={{ marginBottom: '15px' }}>
                            <input
                                type="password"
                                placeholder={t('newPassword')}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '16px'
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <input
                                type="password"
                                placeholder={t('confirmPassword')}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '16px'
                                }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                opacity: isLoading ? 0.7 : 1
                            }}
                        >
                            {isLoading ? t('updating') : t('changePassword')}
                        </button>
                    </form>
                )}

                {/* Global Message/Error Display */}
                {error && <p style={{ marginTop: '15px', color: '#ef4444', textAlign: 'center', fontSize: '14px' }}>{error}</p>}
                {message && !error && <p style={{ marginTop: '15px', color: '#10b981', textAlign: 'center', fontSize: '14px' }}>{message}</p>}
            </div>
        </BaseModal>
    )
}

export default ChangePasswordModal
