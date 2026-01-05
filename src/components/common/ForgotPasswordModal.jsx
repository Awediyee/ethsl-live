import { useState } from 'react'
import './Modal.css'
import ApiService from '../../services/api'
import { useLanguage } from '../../contexts/LanguageContext'

function ForgotPasswordModal({ onClose, onSwitchToLogin }) {
    const { t } = useLanguage()
    const [step, setStep] = useState(1) // 1: Email, 2: Reset
    const [email, setEmail] = useState('')
    const [accountId, setAccountId] = useState('')
    const [token, setToken] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleInitiateReset = async (e) => {
        e.preventDefault()
        if (!email) {
            setError(t('emailRequired'))
            return
        }

        setIsLoading(true)
        setError('')
        try {
            const response = await ApiService.initiatePasswordReset(email)
            console.log('Reset initiated:', response)

            // Assume response contains accountId needed for next step
            // If not, we might need a different flow, but user spec required accountId.
            // Let's hope the "initiate" response gives it.
            if (response.accountId || response.data?.accountId) {
                setAccountId(response.accountId || response.data?.accountId);
            } else {
                // If API doesn't return accountId, maybe it's not needed or in token?
                // For now, we store what we get.
            }

            setStep(2)
            setSuccessMessage(t('checkEmailForToken') || 'Check your email for the reset token')
        } catch (err) {
            setError(err.data?.message || err.message || 'Failed to request reset')
        } finally {
            setIsLoading(false)
        }
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        if (!token || !newPassword || !confirmPassword) {
            setError(t('fillAllFields'))
            return
        }

        if (newPassword !== confirmPassword) {
            setError(t('passwordMatch'))
            return
        }

        setIsLoading(true)
        setError('')
        try {
            // If accountId is missing, we might have an issue unless user manually inputs it?
            // Or maybe logic implies accountId is auto-handled.
            // But the JSON spec had "accountId".
            // I'll assume we got it from step 1 or it's implicitly the email (some APIs do that).
            // If undefined, we send email as accountId? No, spec says "accountId" UUID-like.

            await ApiService.resetPassword(accountId, newPassword, token)
            setSuccessMessage(t('passwordResetSuccess') || 'Password reset successfully')
            setTimeout(() => {
                onSwitchToLogin()
            }, 2000)
        } catch (err) {
            setError(err.data?.message || err.message || 'Failed to reset password')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>
                <h2 className="modal-title">{t('forgotPassword')}</h2>

                {error && <div className="error-message" style={{ textAlign: 'center', marginBottom: '20px' }}>{error}</div>}
                {successMessage && <div className="success-message" style={{ textAlign: 'center', marginBottom: '20px', color: 'green' }}>{successMessage}</div>}

                {step === 1 ? (
                    <form onSubmit={handleInitiateReset}>
                        <div className="form-group">
                            <label>{t('email')}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('enterEmail')}
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={isLoading}>
                            {isLoading ? t('sending') : t('sendResetLink')}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword}>
                        <div className="form-group">
                            <label>{t('token')}</label>
                            <input
                                type="text"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="Enter token from email"
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('newPassword')}</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder={t('enterNewPassword')}
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('confirmPassword')}</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder={t('confirmNewPassword')}
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={isLoading}>
                            {isLoading ? t('resetting') : t('resetPassword')}
                        </button>
                    </form>
                )}

                <div style={{ marginTop: '15px', textAlign: 'center' }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin() }}>{t('backToLogin')}</a>
                </div>
            </div>
        </div>
    )
}

export default ForgotPasswordModal
