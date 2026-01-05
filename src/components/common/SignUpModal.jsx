import { useState } from 'react'
import './Modal.css'
import ApiService from '../../services/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'

function SignUpModal({ onClose, onVerify, email }) {
  const { t } = useLanguage()
  const auth = useAuth()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const handleCodeChange = (index, value) => {
    if (value.length <= 1) {
      const newCode = [...code]
      newCode[index] = value
      setCode(newCode)

      // Clear error when user starts typing
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
      setError(t('otpRequired') || 'Enter 6-digit code')
      return
    }

    if (!/^\d{6}$/.test(otpCode)) {
      setError(t('otpInvalid') || 'Digital code only')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      console.log('Attempting OTP verification with:', { email, otp: otpCode })

      const user = await auth.verifyOTP(email, otpCode)
      console.log('OTP verification successful:', user)

      // Pass the verification code and response to parent component
      if (onVerify) onVerify(otpCode, { user })
    } catch (error) {
      console.error('OTP verification failed:', error)
      const errorMessage = error.data?.message || error.message || 'Verification failed'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    setError('')

    try {
      console.log('Resending OTP to:', email)

      await ApiService.resendOTP(email)

      // Clear the code inputs
      setCode(['', '', '', '', '', ''])

      // Focus on first input
      document.getElementById('code-0')?.focus()

      console.log('OTP resent')
    } catch (error) {
      console.error('Failed to resend OTP:', error)
      setError(error.message || 'Failed to resend')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 className="modal-title signup-title">{t('verifyEmail')}</h2>

        <p style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-secondary)' }}>
          {t('codeSentTo')}<br />
          <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('verificationCode')}</label>
            <div className="verification-code">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  className={`code-input ${error ? 'error' : ''}`}
                  disabled={isLoading}
                />
              ))}
            </div>
            {error && <span className="error-message">{error}</span>}
          </div>

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={isLoading}
          >
            {isLoading ? t('verifying') : t('verifyAndComplete')}
          </button>

          <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            {t('didntReceive')}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || isLoading}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-color)',
                cursor: (isResending || isLoading) ? 'not-allowed' : 'pointer',
                textDecoration: 'underline',
                marginLeft: '5px',
                opacity: (isResending || isLoading) ? 0.6 : 1
              }}
            >
              {isResending ? t('resending') : t('resend')}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}

export default SignUpModal
