import { useState, useEffect } from 'react'
import './Menu.css'
import { useLanguage } from '../../contexts/LanguageContext'
import ApiService from '../../services/api'

function UserMenu({ onClose, user, onLogout, onSettingsClick }) {
  const { t } = useLanguage()
  const [subscription, setSubscription] = useState(null)

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await ApiService.getUserCurrentSubscription()
        setSubscription(response && response.data ? response.data : { isFree: true })
      } catch (err) {
        if (err.status === 404) {
          setSubscription({ isFree: true })
        } else {
          console.warn('Failed to fetch subscription in menu:', err)
        }
      }
    }
    fetchSubscription()
  }, [])

  const handleSettingsClick = (e, tab) => {
    e.preventDefault()
    onSettingsClick && onSettingsClick(tab)
    onClose()
  }

  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-panel" onClick={(e) => e.stopPropagation()}>
        <div className="menu-header">
          <div className="menu-header-row">
            <button className="menu-close-btn" onClick={onClose}>
              <span className="close-icon">✕</span>
            </button>

            <div className="menu-brand">
              <div className="brand-logo">
                <span className="hand-icon">✋</span>
              </div>
              <div className="brand-text">
                {t('appTitle')}
              </div>
            </div>
          </div>

          <nav className="menu-nav">
            <a href="#history" onClick={(e) => handleSettingsClick(e, 'History')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {t('history')}
            </a>
            <a href="#api" onClick={(e) => handleSettingsClick(e, 'Api')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
              {t('api')}
            </a>
            <a href="#subscription" onClick={(e) => handleSettingsClick(e, 'Subscription')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 00 2 2h12a2 2 0 00 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
              {t('subscription')}
            </a>
            <a href="#settings" onClick={(e) => handleSettingsClick(e, 'Settings')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
              {t('settings')}
            </a>
            <a href="#about" onClick={(e) => handleSettingsClick(e, 'About')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
              {t('about')}
            </a>
          </nav>
        </div>

        <div className="menu-bottom-section">
          <div className="menu-user-info">
            <div className="menu-avatar">
              {(user?.firstName?.[0] || user?.email?.[0] || '?').toUpperCase()}
            </div>
            <div className="menu-user-details">
              <h2 className="menu-display-name">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : (user?.firstName || user?.lastName || user?.email?.split('@')[0])}
              </h2>
              <p className="menu-display-email">{user?.email}</p>
              {subscription && (
                <div className="menu-user-subscription">
                  <span className={`sub-badge ${subscription.isFree ? 'free' : 'pro'}`}>
                    {subscription.package?.package_name || subscription.package?.packageName || t('freeTier')}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default UserMenu
