import { useState } from 'react'
import './Modal.css'
import ApiService from '../../services/api'
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
      console.log('=== LOGIN ATTEMPT STARTED ===')
      console.log('Attempting login with:', { email, password: '***' })

      const user = await auth.login(email, password)

      console.log('=== LOGIN SUCCESSFUL ===')
      console.log('User object:', user)
      console.log('User role:', user?.role)
      console.log('User email:', user?.email)
      console.log('Is admin:', user?.isAdmin)

      // Pass the login data to parent component (App.jsx will handle redirection)
      if (onLogin) onLogin(email, password, { user })
    } catch (error) {
      console.error('=== LOGIN FAILED ===')
      console.error('Error object:', error)
      console.error('Error status:', error.status)
      console.error('Error message:', error.message)
      console.error('Error data:', error.data)
      console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))

      let errorMessage = error.message || t('login') + ' failed'

      // Handle specific error cases
      if (error.status === 400) {
        // If server provides a specific message, use it. Otherwise fall back to generic.
        errorMessage = error.data?.message || error.message || t('fillAllFields')
        console.log('400 Error - Bad Request:', errorMessage)
      } else if (error.status === 401) {
        errorMessage = error.data?.message || 'Invalid email or password'
        console.log('401 Error - Unauthorized:', errorMessage)
      } else {
        console.log('Other error status:', error.status, errorMessage)
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    // Clear error when user starts typing
    if (error) setError('')

    if (field === 'email') setEmail(value)
    if (field === 'password') setPassword(value)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 className="modal-title">{t('login')}</h2>

        {error && (
          <div className="error-message" style={{ textAlign: 'center', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('email')}</label>
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

          <div className="form-group">
            <label>{t('password')}</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder={t('enterPassword')}
                className={error ? 'error' : ''}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
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

          <a href="#" className="forgot-password">{t('forgotPassword')}</a>

          <div className="button-group">
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? t('loggingIn') : t('login')}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onRegisterClick}
              disabled={isLoading}
            >
              {t('register')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginModal