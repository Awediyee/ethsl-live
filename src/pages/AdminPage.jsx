import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/common/Header'
import { useAuth } from '../contexts/AuthContext'
import { useModal } from '../contexts/ModalContext'
import { useLanguage } from '../contexts/LanguageContext'
import ApiService from '../services/api'
import AnalyticsCard from '../components/admin/AnalyticsCard'
import './AdminPage.css'

function AdminPage() {
    const { isLoggedIn, user, logout } = useAuth()
    const { actions: modalActions } = useModal()
    const { t } = useLanguage()
    const navigate = useNavigate()

    const [analytics, setAnalytics] = useState({
        totalUsers: 0,
        totalTranslations: 0,
        activeSessions: 0,
        systemHealth: 0
    })
    const [loading, setLoading] = useState(true)

    const isAdmin = user?.isAdmin || user?.role === 'admin' || false
    const userEmail = user?.email || ''

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true)
            try {
                const data = await ApiService.getAdminAnalytics()
                setAnalytics({
                    totalUsers: data.totalUsers || 0,
                    totalTranslations: data.totalTranslations || 0,
                    activeSessions: data.activeSessions || 0,
                    systemHealth: data.systemHealth || 100
                })
            } catch (error) {
                console.error('Failed to fetch analytics:', error)
                // Optionally handle error state here, e.g. show toast
            } finally {
                setLoading(false)
            }
        }

        fetchAnalytics()
    }, [])

    return (
        <div className="admin-page">
            <Header
                isLoggedIn={isLoggedIn}
                isAdmin={isAdmin}
                userEmail={userEmail}
                userData={user}
                onLoginClick={() => navigate('/login')}
                onLogout={logout}
                onSettingsClick={(modalName) => {
                    modalActions.setActiveModal(modalName)
                }}
            />

            <div className="admin-container">
                <div className="admin-header">
                    <div className="admin-header-content">
                        <h1 className="admin-title">{t('dashboard')}</h1>
                        <p className="admin-subtitle">{t('welcomeBack')}, {userEmail.split('@')[0]}! 👋</p>
                    </div>
                    <div className="admin-header-actions">
                        <button className="admin-btn admin-btn-secondary" onClick={() => window.location.reload()}>
                            <span>🔄</span> {t('refresh')}
                        </button>
                        <button className="admin-btn admin-btn-primary" onClick={() => modalActions.openModal('AdminSettings')}>
                            <span>⚙️</span> {t('settings')}
                        </button>
                    </div>
                </div>

                <div className="analytics-grid">
                    <AnalyticsCard
                        title={t('totalUsers')}
                        value={analytics.totalUsers}
                        icon="👥"
                        trend="up"
                        trendValue={12}
                        color="primary"
                        loading={loading}
                    />
                    <AnalyticsCard
                        title={t('translations')}
                        value={analytics.totalTranslations}
                        icon="🔤"
                        trend="up"
                        trendValue={8}
                        color="success"
                        loading={loading}
                    />
                    <AnalyticsCard
                        title={t('activeSessions')}
                        value={analytics.activeSessions}
                        icon="⚡"
                        trend="down"
                        trendValue={3}
                        color="warning"
                        loading={loading}
                    />

                </div>

                <div className="admin-sections">
                    <div className="admin-section admin-section-full">
                        <div className="section-header">
                            <h2 className="section-title">{t('quickActions')}</h2>
                        </div>
                        <div className="quick-actions">
                            <button className="quick-action-btn" onClick={() => modalActions.openModal('ManageRoles')}>
                                <span className="quick-action-icon">🔑</span>
                                <span className="quick-action-text">{t('manageRoles') || 'Manage Roles'}</span>
                            </button>
                            <button className="quick-action-btn" onClick={() => modalActions.openModal('ManageUsers')}>
                                <span className="quick-action-icon">👥</span>
                                <span className="quick-action-text">{t('manageUsers')}</span>
                            </button>
                            <button className="quick-action-btn" onClick={() => modalActions.openModal('ManageAdmin')}>
                                <span className="quick-action-icon">🛡️</span>
                                <span className="quick-action-text">{t('manageAdmin')}</span>
                            </button>
                            <button className="quick-action-btn" onClick={() => modalActions.openModal('ViewReports')}>
                                <span className="quick-action-icon">📊</span>
                                <span className="quick-action-text">{t('viewReports')}</span>
                            </button>
                            <button className="quick-action-btn" onClick={() => modalActions.openModal('AdminSettings')}>
                                <span className="quick-action-icon">⚙️</span>
                                <span className="quick-action-text">{t('systemSettings')}</span>
                            </button>
                            <button className="quick-action-btn" onClick={() => modalActions.openModal('ActivityLogs')}>
                                <span className="quick-action-icon">📝</span>
                                <span className="quick-action-text">{t('activityLogs')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminPage
