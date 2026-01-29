import { useState } from 'react'
import BaseModal from './BaseModal'
import LoadingSpinner from './LoadingSpinner'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'

function LoginModal({ onClose, onLogin, onRegisterClick, onForgotPasswordClick }) {
  const { t } = useLanguage()
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      setError(t('fillAllFields'))
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const user = await auth.login(email, password)
      if (onLogin) onLogin(email, password, { user })
    } catch (error) {
      console.error('Login failed:', error)
      setError(error.message || t('loginFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    if (error) setError('')
    if (field === 'email') setEmail(value)
    if (field === 'password') setPassword(value)
  }

  return (
    <BaseModal title={t('login')} onClose={onClose} maxWidth="450px">
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

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder={t('enterEmail')}
              className={error ? 'error' : ''}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>{t('password')}</label>
            <div className="password-input-wrapper" style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder={t('enterPassword')}
                className={error ? 'error' : ''}
                disabled={isLoading}
                required
                style={{ paddingRight: '45px' }}
              />
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                style={{
                  position: 'absolute',
                  right: '5px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '8px',
                  height: 'auto'
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '25px', textAlign: 'right' }}>
            <a href="#" className="forgot-password"
              onClick={(e) => { e.preventDefault(); onForgotPasswordClick && onForgotPasswordClick() }}
              style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: 'none' }}
              onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
              onMouseOut={(e) => e.target.style.textDecoration = 'none'}
            >
              {t('forgotPassword')}
            </a>
          </div>

          <div className="button-group" style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              style={{ flex: 1 }}
            >
              {isLoading ? <LoadingSpinner size="small" color="white" /> : t('login')}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onRegisterClick}
              disabled={isLoading}
              style={{ flex: 1 }}
            >
              {t('register')}
            </button>
          </div>
        </form>
      </div>
    </BaseModal>
  )
}

export default LoginModal
