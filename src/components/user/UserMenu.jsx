import './Menu.css'
import { useLanguage } from '../../contexts/LanguageContext'

function UserMenu({ onClose, user, onLogout, onSettingsClick }) {
  const { t } = useLanguage()

  const handleSettingsClick = (e, tab) => {
    e.preventDefault()
    onSettingsClick && onSettingsClick(tab)
    onClose()
  }

  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-panel" onClick={(e) => e.stopPropagation()}>
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
          <a href="#history" onClick={(e) => handleSettingsClick(e, 'History')}>{t('history')}</a>
          <a href="#api" onClick={(e) => handleSettingsClick(e, 'Api')}>{t('api')}</a>
          <a href="#subscription" onClick={(e) => handleSettingsClick(e, 'Subscription')}>{t('subscription')}</a>
          <a href="#about" onClick={(e) => handleSettingsClick(e, 'About')}>{t('about')}</a>
          <a href="#settings" onClick={(e) => handleSettingsClick(e, 'Settings')}>{t('settings')}</a>
        </nav>

        <div className="menu-footer">
          <a href="#" className="sign-out-link" onClick={(e) => {
            e.preventDefault()
            onLogout && onLogout()
            onClose()
          }}>
            {t('signOut')}
          </a>
        </div>
      </div>
    </div>
  )
}

export default UserMenu
