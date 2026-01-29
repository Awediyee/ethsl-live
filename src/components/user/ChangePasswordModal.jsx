import { useState } from 'react'
import BaseModal from '../common/BaseModal'
import { useLanguage } from '../../contexts/LanguageContext'
import { useToast } from '../../contexts/ToastContext'
import ApiService from '../../services/api'

function ChangePasswordModal({ onClose }) {
    const { t } = useLanguage()
    const { showToast } = useToast()

    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // Single Visibility State for all fields
    const [showPasswords, setShowPasswords] = useState(false)

    // UI State
    const [isLoading, setIsLoading] = useState(false)

    const handleChangePassword = async (e) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            showToast(t('passwordMismatch'), 'error')
            return
        }

        if (newPassword.length < 6) {
            showToast(t('passwordLength'), 'error')
            return
        }

        setIsLoading(true)
        try {
            await ApiService.changePassword(currentPassword, newPassword)
            showToast(t('passwordChangeSuccess'), 'success')

            // Close modal after success
            setTimeout(() => {
                onClose()
            }, 1500)
        } catch (err) {
            console.error('Password change error:', err)
            const errorMessage = err.data?.message || t('passwordChangeError')
            showToast(errorMessage, 'error')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <BaseModal title={t('changePassword')} onClose={onClose} maxWidth="450px">
            <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        {t('securityVerify') || 'Enter your password details to update your account security.'}
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--primary-color)',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '4px',
                            borderRadius: '4px',
                            transition: 'background 0.2s'
                        }}
                        title={showPasswords ? t('hidePasswords') || 'Hide passwords' : t('showPasswords') || 'Show passwords'}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                    >
                        {showPasswords ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        )}
                    </button>
                </div>

                <form onSubmit={handleChangePassword} className="settings-form">
                    <div className="settings-input-group">
                        <label>{t('currentPassword')}</label>
                        <input
                            type={showPasswords ? 'text' : 'password'}
                            placeholder={t('currentPassword')}
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="settings-input-group">
                        <label>{t('newPassword')}</label>
                        <input
                            type={showPasswords ? 'text' : 'password'}
                            placeholder={t('newPassword')}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="settings-input-group">
                        <label>{t('confirmPassword')}</label>
                        <input
                            type={showPasswords ? 'text' : 'password'}
                            placeholder={t('confirmPassword')}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ marginTop: '24px' }}>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary"
                            style={{ width: '100%', padding: '12px' }}
                        >
                            {isLoading ? t('updating') : t('updatePassword')}
                        </button>
                    </div>
                </form>
            </div>
        </BaseModal>
    )
}

export default ChangePasswordModal
