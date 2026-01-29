import { useState, useEffect } from 'react'
import BaseModal from './BaseModal'
import LoadingSpinner from './LoadingSpinner'
import { useLanguage } from '../../contexts/LanguageContext'
import ApiService from '../../services/api'

function ForgotPasswordModal({ onClose, onSwitchToLogin }) {
    const { t } = useLanguage()
    const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('')
    const [code, setCode] = useState(['', '', '', '', '', '']) // OTP Code
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [accountId, setAccountId] = useState('')
    const [resetToken, setResetToken] = useState('')

    // Clear error when switching steps
    useEffect(() => {
        setError('')
        setSuccessMessage('')
    }, [step])

    // --- Step 1: Send OTP ---
    const handleSendOTP = async (e) => {
        e.preventDefault()
        if (!email) {
            setError(t('emailRequired'))
            return
        }

        setIsLoading(true)
        setError('')
        try {
            await ApiService.resendOTP(email.trim())
            setStep(2)
            setSuccessMessage(t('codeSentTo') + ' ' + email)
        } catch (err) {
            console.error('Send OTP Error:', err)
            setError(err.data?.message || err.message || t('errorSendingCode'))
        } finally {
            setIsLoading(false)
        }
    }

    // --- Step 2: Verify OTP ---
    const handleCodeChange = (index, value) => {
        if (value && !/^\d+$/.test(value)) return

        if (value.length <= 1) {
            const newCode = [...code]
            newCode[index] = value
            setCode(newCode)
            if (error) setError('')
            if (value && index < 5) {
                document.getElementById(`reset-code-${index + 1}`)?.focus()
            }
        }
    }

    const handleVerifyOTP = async (e) => {
        e.preventDefault()
        const otpCode = code.join('')
        if (otpCode.length !== 6) {
            setError(t('otpRequired') || 'Enter 6-digit code')
            return
        }

        setIsLoading(true)
        setError('')
        try {
            const response = await ApiService.getResetPasswordToken(email, otpCode)
            const responseData = response.data || response

            if (responseData && responseData.token) {
                if (responseData.accountId) setAccountId(responseData.accountId)
                setResetToken(responseData.token)
                setStep(3)
                setSuccessMessage(t('codeVerified') || 'Code verified successfully')
            } else {
                setError(t('verificationFailed') || 'Verification failed')
            }
        } catch (err) {
            console.error(err)
            setError(err.data?.message || err.message || t('invalidCode'))
        } finally {
            setIsLoading(false)
        }
    }

    // --- Step 3: Change Password ---
    const handleChangePassword = async (e) => {
        e.preventDefault()
        if (!newPassword || !confirmPassword) {
            setError(t('fillAllFields'))
            return
        }

        if (newPassword.length < 6) {
            setError(t('passwordLength') || 'Password must be at least 6 characters')
            return
        }

        if (newPassword !== confirmPassword) {
            setError(t('passwordMatch'))
            return
        }

        setIsLoading(true)
        setError('')
        try {
            await ApiService.resetPassword(accountId, newPassword, resetToken)
            setSuccessMessage(t('passwordResetSuccess') || 'Password reset successfully')
            setTimeout(() => {
                onSwitchToLogin()
            }, 2000)
        } catch (err) {
            console.error(err)
            setError(err.data?.message || err.message || t('failedToResetPassword'))
        } finally {
            setIsLoading(false)
        }
    }

    const renderStep1 = () => (
        <form onSubmit={handleSendOTP}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>{t('email')}</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('enterEmail')}
                    disabled={isLoading}
                    required
                />
            </div>
            <button type="submit" className="btn-primary" disabled={isLoading} style={{ width: '100%', marginBottom: '15px' }}>
                {isLoading ? <LoadingSpinner size="small" color="white" /> : t('sendResetCode')}
            </button>
        </form>
    )

    const renderStep2 = () => (
        <form onSubmit={handleVerifyOTP}>
            <p style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {t('codeSentTo')}<br />
                <strong>{email}</strong>
            </p>

            <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500', textAlign: 'center' }}>{t('verificationCode')}</label>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            id={`reset-code-${index}`}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleCodeChange(index, e.target.value)}
                            className={error ? 'error' : ''}
                            disabled={isLoading}
                            onKeyDown={(e) => {
                                if (e.key === 'Backspace' && !digit && index > 0) {
                                    document.getElementById(`reset-code-${index - 1}`)?.focus()
                                }
                            }}
                            style={{ width: '45px', height: '50px', textAlign: 'center', fontSize: '1.25rem', fontWeight: '600', border: '1px solid var(--border-color)', padding: '0' }}
                        />
                    ))}
                </div>
            </div>
            <button type="submit" className="btn-primary" disabled={isLoading} style={{ width: '100%', marginBottom: '15px' }}>
                {isLoading ? <LoadingSpinner size="small" color="white" /> : t('verifyCode')}
            </button>
            <div style={{ textAlign: 'center' }}>
                <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                    style={{ fontSize: '0.9rem', color: 'var(--primary-color)', textDecoration: 'underline' }}
                >
                    {t('changeEmail')}
                </button>
            </div>
        </form>
    )

    const renderStep3 = () => (
        <form onSubmit={handleChangePassword}>
            <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>{t('newPassword')}</label>
                <div className="password-input-wrapper" style={{ position: 'relative' }}>
                    <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t('enterNewPassword')}
                        disabled={isLoading}
                        required
                        style={{ paddingRight: '45px' }}
                    />
                    <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex="-1"
                        style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', padding: '8px', height: 'auto' }}
                    >
                        {showPassword ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        )}
                    </button>
                </div>
            </div>
            <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>{t('confirmPassword')}</label>
                <div className="password-input-wrapper" style={{ position: 'relative' }}>
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('confirmNewPassword')}
                        disabled={isLoading}
                        required
                        style={{ paddingRight: '45px' }}
                    />
                    <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex="-1"
                        style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', padding: '8px', height: 'auto' }}
                    >
                        {showConfirmPassword ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        )}
                    </button>
                </div>
            </div>
            <button type="submit" className="btn-primary" disabled={isLoading} style={{ width: '100%', marginBottom: '15px' }}>
                {isLoading ? <LoadingSpinner size="small" color="white" /> : t('resetPasswordButton')}
            </button>
        </form>
    )

    return (
        <BaseModal
            title={step === 1 ? t('forgotPasswordTitle') : step === 2 ? t('verifyEmailTitle') : t('resetPasswordTitle')}
            onClose={onClose}
            maxWidth="450px"
        >
            <div className="animate-fade-in" style={{ padding: '0 8px' }}>
                {error && (
                    <div className="error-message" style={{
                        textAlign: 'center',
                        marginBottom: '20px',
                        color: '#ef4444',
                        fontSize: '0.9rem',
                        padding: '10px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '6px'
                    }}>
                        {error}
                    </div>
                )}

                {successMessage && !error && (
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '20px',
                        color: '#10b981',
                        fontSize: '0.9rem',
                        padding: '10px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '6px'
                    }}>
                        {successMessage}
                    </div>
                )}

                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin() }}
                        style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}
                        onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                    >
                        {t('backToLogin')}
                    </a>
                </div>
            </div>
        </BaseModal>
    )
}

export default ForgotPasswordModal
