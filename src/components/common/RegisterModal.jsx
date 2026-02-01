import { useState } from 'react'
import BaseModal from './BaseModal'
import LoadingSpinner from './LoadingSpinner'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'
import SecurityUtils from '../../utils/security'

function RegisterModal({ onClose, onRegister }) {
  const { t } = useLanguage()
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateForm = () => {
    const newErrors = {}

    if (!email) {
      newErrors.email = t('emailRequired')
    } else if (!SecurityUtils.isValidEmail(email)) {
      newErrors.email = t('validEmail')
    }

    if (!password) {
      newErrors.password = t('passwordRequired')
    } else if (password.length < 6) {
      newErrors.password = t('passwordLength')
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t('enterConfirmPassword')
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t('passwordMatch')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const sanitizedEmail = SecurityUtils.sanitizeInput(email)
      const response = await auth.register(sanitizedEmail, password)
      if (onRegister) onRegister(sanitizedEmail, password, response)
    } catch (error) {
      console.error('Registration failed:', error)
      setErrors({ general: error.data?.message || error.message || t('registrationFailed') })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    if (errors[field] || errors.general) {
      setErrors(prev => ({ ...prev, [field]: '', general: '' }))
    }

    if (field === 'email') setEmail(value)
    if (field === 'password') setPassword(value)
    if (field === 'confirmPassword') setConfirmPassword(value)
  }

  return (
    <BaseModal title={t('createAccount')} onClose={onClose} maxWidth="450px">
      <div className="animate-fade-in" style={{ padding: '0 8px' }}>
        {errors.general && (
          <div className="error-message" style={{
            textAlign: 'center',
            marginBottom: '20px',
            color: '#ef4444',
            fontSize: '0.9rem',
            padding: '10px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '6px'
          }}>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder={t('enterEmail')}
              className={errors.email ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.email && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.email}</span>}
          </div>

          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>{t('password')}</label>
            <div className="password-input-wrapper" style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder={t('enterPassword')}
                className={errors.password ? 'error' : ''}
                disabled={isLoading}
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
            {errors.password && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.password}</span>}
          </div>

          <div className="form-group" style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>{t('confirmPassword')}</label>
            <div className="password-input-wrapper" style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder={t('enterConfirmPassword')}
                className={errors.confirmPassword ? 'error' : ''}
                disabled={isLoading}
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
            {errors.confirmPassword && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.confirmPassword}</span>}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ width: '100%', marginBottom: '10px' }}
          >
            {isLoading ? <LoadingSpinner size="small" color="white" /> : t('register')}
          </button>
        </form>
      </div>
    </BaseModal>
  )
}

export default RegisterModal