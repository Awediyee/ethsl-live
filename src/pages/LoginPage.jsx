import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoginBackground from '../components/common/LoginBackground'
import LoginModal from '../components/common/LoginModal'
import RegisterModal from '../components/common/RegisterModal'
import SignUpModal from '../components/common/SignUpModal'
import ForgotPasswordModal from '../components/common/ForgotPasswordModal'
import { useLanguage } from '../contexts/LanguageContext'
import ThemeToggle from '../components/user/ThemeToggle'
import LanguageToggle from '../components/user/LanguageToggle'
import LoadingSpinner from '../components/common/LoadingSpinner'
import './LoginPage.css'

function LoginPage() {
    const { isLoggedIn, user, loading } = useAuth()
    const { t } = useLanguage()
    const navigate = useNavigate()
    const [view, setView] = useState('login') // 'login', 'register', 'otp', 'forgot'
    const [email, setEmail] = useState('')

    useEffect(() => {
        if (isLoggedIn && !loading) {
            if (user?.role === 'user') {
                navigate('/')
            } else {
                navigate('/admin')
            }
        }
    }, [isLoggedIn, loading, user, navigate])

    const handleLogin = (email, password, response) => {
        if (response?.user) {
            // Navigation is handled by useEffect
        }
    }

    const handleRegister = (regEmail) => {
        setEmail(regEmail)
        setView('otp')
    }



    const handleVerifyOTP = (code, response) => {
        alert(t('verificationSuccess'))
        setView('login')
    }

    if (loading) {
        return (
            <div className="login-page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <LoginBackground />
                <div className="animate-fade-in" style={{ textAlign: 'center', zIndex: 1 }}>
                    <LoadingSpinner size="large" />
                    <p style={{ marginTop: '20px', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{t('loading') || 'Loading...'}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="login-page-container">
            <LoginBackground />

            <div className="login-page-header">
                <div className="header-left">
                    <div className="company-logo">✋</div>
                    <div className="company-name">{t('appName')}</div>
                </div>
                <div className="header-controls">
                    <LanguageToggle />
                    <ThemeToggle />
                </div>
            </div>

            <div className="auth-content-wrapper">
                {view === 'login' && (
                    <LoginModal
                        onClose={() => { }} // No close on dedicated page
                        onLogin={handleLogin}
                        onRegisterClick={() => setView('register')}
                        onForgotPasswordClick={() => setView('forgot')}
                    />
                )}

                {view === 'register' && (
                    <RegisterModal
                        onClose={() => setView('login')}
                        onRegister={(e) => handleRegister(e)}
                        onSwitchToLogin={() => setView('login')}
                    />
                )}

                {view === 'otp' && (
                    <SignUpModal
                        onClose={() => setView('register')}
                        onVerify={handleVerifyOTP}
                        email={email}
                        onSwitchToLogin={() => setView('login')}
                    />
                )}

                {view === 'forgot' && (
                    <ForgotPasswordModal
                        onClose={() => setView('login')}
                        onSwitchToLogin={() => setView('login')}
                    />
                )}
            </div>
        </div>
    )
}

export default LoginPage
