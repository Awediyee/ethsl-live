import { useState } from 'react'
import BaseModal from './BaseModal'
import LoadingSpinner from './LoadingSpinner'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'
import ApiService from '../../services/api'

function SignUpModal({ onClose, onVerify, email }) {
  const { t } = useLanguage()
  const auth = useAuth()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const handleCodeChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return

    if (value.length <= 1) {
      const newCode = [...code]
      newCode[index] = value
      setCode(newCode)
      if (error) setError('')
      if (value && index < 5) {
        document.getElementById(`code-${index + 1}`)?.focus()
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otpCode = code.join('')

    if (otpCode.length !== 6) {
      setError(t('otpRequired'))
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const user = await auth.verifyOTP(email, otpCode)
      if (onVerify) onVerify(otpCode, { user })
    } catch (error) {
      console.error('OTP verification failed:', error)
      setError(error.data?.message || error.message || t('verificationFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    setError('')

    try {
      await ApiService.resendOTP(email)
      setCode(['', '', '', '', '', ''])
      document.getElementById('code-0')?.focus()
    } catch (error) {
      console.error('Failed to resend OTP:', error)
      setError(error.message || t('resendFailed'))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <BaseModal title={t('verifyEmail')} onClose={onClose} maxWidth="450px">
      <div className="animate-fade-in" style={{ padding: '0 8px' }}>
        <p style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {t('codeSentTo')}<br />
          <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
        </p>

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

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500', textAlign: 'center' }}>
              {t('verificationCode')}
            </label>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  className={error ? 'error' : ''}
                  disabled={isLoading}
                  style={{
                    width: '45px',
                    height: '50px',
                    textAlign: 'center',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    border: '1px solid var(--border-color)',
                    padding: '0'
                  }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ width: '100%', marginBottom: '20px' }}
          >
            {isLoading ? <LoadingSpinner size="small" color="white" /> : t('verifyAndComplete')}
          </button>

          <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {t('didntReceive')}
            <button
              type="button"
              className="btn-ghost"
              onClick={handleResend}
              disabled={isResending || isLoading}
              style={{ padding: '4px 8px', textDecoration: 'underline', color: 'var(--primary-color)' }}
            >
              {isResending ? <LoadingSpinner size="small" /> : t('resend')}
            </button>
          </div>
        </form>
      </div>
    </BaseModal>
  )
}

export default SignUpModal
