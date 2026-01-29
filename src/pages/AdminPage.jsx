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
                        <p className="admin-subtitle">{t('welcomeBack')}, {userEmail.split('@')[0]}!</p>
                    </div>
                    <div className="admin-header-actions">
                        <button className="admin-btn admin-btn-secondary" onClick={() => window.location.reload()}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 2v6h-6" />
                                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                                <path d="M3 22v-6h6" />
                                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                            </svg>
                            {t('refresh')}
                        </button>
                        <button className="admin-btn admin-btn-primary" onClick={() => modalActions.openModal('AdminSettings')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            {t('settings')}
                        </button>
                    </div>
                </div>

                <div className="analytics-grid">
                    <AnalyticsCard
                        title={t('totalUsers')}
                        value={analytics.totalUsers}
                        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-3-3.87" /><path d="M9 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><circle cx="17" cy="7" r="4" /></svg>}
                        trend="up"
                        trendValue={12}
                        color="primary"
                        loading={loading}
                    />
                    <AnalyticsCard
                        title={t('translations')}
                        value={analytics.totalTranslations}
                        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></svg>}
                        trend="up"
                        trendValue={8}
                        color="success"
                        loading={loading}
                    />
                    <AnalyticsCard
                        title={t('activeSessions')}
                        value={analytics.activeSessions}
                        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>}
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
                                <span className="quick-action-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                </span>
                                <span className="quick-action-text">{t('manageRoles') || 'Manage Roles'}</span>
                            </button>
                            <button className="quick-action-btn" onClick={() => modalActions.openModal('ManageUsers')}>
                                <span className="quick-action-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><circle cx="17" cy="7" r="4" /></svg>
                                </span>
                                <span className="quick-action-text">{t('manageUsers')}</span>
                            </button>
                            <button className="quick-action-btn" onClick={() => modalActions.openModal('ManageAdmin')}>
                                <span className="quick-action-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                </span>
                                <span className="quick-action-text">{t('manageAdmin')}</span>
                            </button>
                            <button className="quick-action-btn" onClick={() => modalActions.openModal('ViewReports')}>
                                <span className="quick-action-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="20" x2="18" y2="10" />
                                        <line x1="12" y1="20" x2="12" y2="4" />
                                        <line x1="6" y1="20" x2="6" y2="14" />
                                    </svg>
                                </span>
                                <span className="quick-action-text">{t('viewReports')}</span>
                            </button>
                            <button className="quick-action-btn" onClick={() => modalActions.openModal('AdminSettings')}>
                                <span className="quick-action-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                    </svg>
                                </span>
                                <span className="quick-action-text">{t('systemSettings')}</span>
                            </button>
                            <button className="quick-action-btn" onClick={() => modalActions.openModal('ManageSubscriptions')}>
                                <span className="quick-action-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                </span>
                                <span className="quick-action-text">{t('manageSubscriptions')}</span>
                            </button>
                            <button className="quick-action-btn" onClick={() => modalActions.openModal('ActivityLogs')}>
                                <span className="quick-action-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                </span>
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
